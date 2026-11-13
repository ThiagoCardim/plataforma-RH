#!/usr/bin/env python3
"""Disposable, network-disabled PostgreSQL. Never accepts a connection URL."""
import subprocess as sp,json,uuid,time,hashlib,concurrent.futures,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; os.chdir(ROOT)
DOCKER=['docker','--host=unix:///var/run/docker.sock']
IMAGE='postgres:17.6-bookworm@sha256:f3bd19c606e442c3d7bdfa8002e03fe260a1023351e0ea4598032022b68dd6e3'
DOCKER_ENV=os.environ.copy()
for selector in ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']:DOCKER_ENV.pop(selector,None)
def run(*args,**kwargs):
    return sp.run(*args,env=DOCKER_ENV,**kwargs)
name='youcon-final-test-'+uuid.uuid4().hex[:10]; results=[]
def uid(i): return str(uuid.UUID(int=i))
O=uid(10); B=uid(20); HR=uid(1); DIR=uid(2); PRO=uid(3); LEAD=uid(4); HR2=uid(5)
def sql(q,actor=None,ok=True):
    prefix=f"set request.jwt.claim.sub='{actor or HR}';\n"
    if actor: prefix+='set role authenticated;\n'
    r=run(DOCKER+['exec','-i',name,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'],input=prefix+q,text=True,capture_output=True)
    if ok and r.returncode: raise AssertionError(r.stderr+'\n'+q[:400])
    if not ok and not r.returncode: raise AssertionError('Expected rejection: '+q)
    return r.stdout.strip() if ok else r.stderr.strip()
def call(op,data,actor=HR,key=None,ok=True,org=O):
    if op=='edit_person' and 'reason' not in data:data={**data,'reason':'Synthetic edit'}
    payload=json.dumps(data,ensure_ascii=False).replace("'","''")
    result=sql(f"select youcon_people.people_{op}('{org}','{key or uuid.uuid4()}', '{payload}'::jsonb);",actor,ok)
    return json.loads(result) if ok else result
def test(label,fn):
    fn();results.append({'test':label,'status':'PASS'}); print('PASS',label,flush=True)
def assert_(condition):
    if not condition: raise AssertionError('assertion failed')
def contract(person,kind='clt',start='2026-01-01',end=None,leader=None):
    return dict(person_id=person,type=kind,start=start,end=end,unit_id=uid(300),department_id=uid(301),position_id=uid(303),leader_id=leader)
try:
    run(DOCKER+['run','-d','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE],check=True,capture_output=True)
    for _ in range(60):
        if 'PostgreSQL init process complete' in run(DOCKER+['logs',name],capture_output=True,text=True).stdout and run(DOCKER+['exec',name,'pg_isready','-U','postgres'],capture_output=True).returncode==0:break
        time.sleep(.25)
    sql(Path('tests/postgres/bootstrap.sql').read_text())
    before=sql("select md5(pg_get_triggerdef(oid)) from pg_trigger where tgname='legacy_auth';select * from public.legacy_sentinel;")
    sql(Path('supabase/migrations/20261110203914_youcon_people_shared_database_foundation.sql').read_text())
    lots=sorted(Path('docs/stage-03c-final').glob('0*.sql.txt'))
    for lot in lots:sql(lot.read_text())
    seed=f"insert into youcon_people.organizations(id,name,slug) values('{O}','Synthetic A','synthetic-a'),('{B}','Synthetic B','synthetic-b');"
    for i,role in [(1,'hr'),(2,'director'),(3,'professional'),(4,'leadership'),(5,'hr'),(6,'hr')]:
        o=B if i==6 else O
        seed+=f"""insert into youcon_people.profiles(user_id,display_name) values('{uid(i)}','Synthetic {i}');
        insert into youcon_people.memberships(id,organization_id,user_id,contract_type) values('{uid(100+i)}','{o}','{uid(i)}','clt');
        insert into youcon_people.membership_roles values('{uid(100+i)}','{uid(i)}','{role}');
        insert into youcon_people.persons(id,organization_id,internal_code,full_name) values('{uid(200+i)}','{o}','test-{i}','Synthetic {i}');
        insert into youcon_people.person_accounts(organization_id,person_id,user_id,valid_from) values('{o}','{uid(200+i)}','{uid(i)}',now()-interval '2 days');
        insert into youcon_people.access_exceptions(organization_id,person_id,user_id,valid_from,valid_to,reason,approved_by) values('{o}','{uid(200+i)}','{uid(i)}',now()-interval '1 day',now()+interval '1 year','Synthetic administrative bootstrap','{uid(9)}');"""
    for t,id_ in [('units',300),('departments',301),('departments',302),('positions',303),('positions',304)]:
        seed+=f"insert into youcon_people.{t}(id,organization_id,code,name) values('{uid(id_)}','{O}','c-{id_}','Synthetic catalog');"
    for cap in ['people.accounts.link','people.exception.manage','people.private.view','people.private.write','people.export.management']:
        seed+=f"insert into youcon_people.special_grants values('{O}','{HR}','{cap}',now()+interval '1 year','{uid(9)}','Synthetic approval');"
    seed+=f"insert into youcon_people.special_grants values('{O}','{DIR}','people.export.management',now()+interval '1 year','{uid(9)}','Synthetic approval');"
    sql(seed)
    person=call('create_person',{'full_name':'Alice Fictícia'},DIR)['id']
    test('Director creates and HR edits without Auth provisioning',lambda:assert_(bool(call('edit_person',{'person_id':person,'version':1,'display_name':'Alice'},HR))))
    test('Professionals and leadership cannot create',lambda:[call('create_person',{'full_name':'Denied Example'},a,ok=False) for a in [PRO,LEAD]])
    test('Organization and actor cannot be supplied as payload overrides',lambda:call('create_person',{'full_name':'Attack Example','actor_user_id':DIR},ok=False))
    test('Cross-organization RPC denied',lambda:call('create_person',{'full_name':'Denied Foreign'},org=B,ok=False))
    test('Direct authenticated INSERT denied',lambda:sql(f"insert into youcon_people.persons(organization_id,internal_code,full_name) values('{O}','attack','Attack Example')",HR,False))
    test('Internal dispatcher execute denied',lambda:sql(f"select youcon_people_private.command('create_person','{O}',gen_random_uuid(),'{{}}')",HR,False))
    e=call('create_engagement',contract(person))['id']
    test('Two current contracts rejected',lambda:call('create_engagement',contract(person,'pj'),ok=False))
    test('Future contract overlaps open-ended current contract',lambda:call('create_engagement',contract(person,start='2028-01-01'),ok=False))
    # create independent leader
    leaderp=call('create_person',{'full_name':'Leader Fictício'})['id']; leader=call('create_engagement',contract(leaderp))['id']
    move={'engagement_id':e,'version':1,'date':'2026-02-01','unit_id':uid(300),'department_id':uid(302),'position_id':uid(304),'leader_id':leader,'reason':'Synthetic movement'}
    test('Move department position leader and predecessor',lambda:call('move_engagement',move))
    test('Self leadership rejected',lambda:call('move_engagement',{**move,'version':2,'date':'2026-03-01','leader_id':e},ok=False))
    test('Leadership cycle rejected',lambda:call('move_engagement',{**move,'engagement_id':leader,'date':'2026-03-01','leader_id':e},ok=False))
    test('Stale contract version rejected',lambda:call('move_engagement',move,ok=False))
    test('Bad supersedes reference rejected even privileged local DML',lambda:sql(f"update youcon_people.engagement_assignments set supersedes_id=gen_random_uuid() where organization_id='{O}' and engagement_id='{e}'",ok=False))
    test('Closing referenced leader rejected',lambda:call('close_engagement',{'engagement_id':leader,'version':1,'end':'2026-10-01','reason':'Close leader'},ok=False))
    call('close_engagement',{'engagement_id':e,'version':2,'end':'2026-10-01','reason':'Synthetic close'})
    test('Same-day re-entry rejected (inclusive end)',lambda:call('create_engagement',contract(person,'pj','2026-10-01'),ok=False))
    newe=call('create_engagement',contract(person,'pj','2026-10-02'))['id']
    test('Re-entry keeps previous engagement',lambda:assert_(sql(f"select count(*) from youcon_people.engagements where person_id='{person}'")=='2'))
    for kind in ['intern','clt','pj']:
        p=call('create_person',{'full_name':'Type '+kind})['id']; eid=call('create_engagement',contract(p,kind,start='2027-01-01',end='2027-12-31'))['id']
        test('Scheduled '+kind+' detail',lambda eid=eid:assert_(bool(eid)))
        wrong='engagement_pj' if kind!='pj' else 'engagement_clt'
        test('Reject incompatible '+kind+' subtype',lambda eid=eid,wrong=wrong:sql(f"insert into youcon_people.{wrong}(organization_id,engagement_id) values('{O}','{eid}')",ok=False))
    test('Past associations cannot overlap (closed intervals)',lambda:sql(f"insert into youcon_people.person_accounts(organization_id,person_id,user_id,valid_from,valid_to) values('{O}','{uid(203)}','{PRO}',now()-interval '1 day',now()+interval '1 day')",ok=False))
    test('Account from foreign organization rejected',lambda:call('associate_account',{'person_id':person,'user_id':uid(6),'from':'2026-01-01'},ok=False))
    # actual request per own association
    req=call('submit_request',{'person_id':uid(201),'version':1,'field':'display_name','value':'RH requested'},HR)['id']
    test('No self approval',lambda:call('review_request',{'request_id':req,'approve':True,'reason':'self'},HR,ok=False))
    test('Exceptional director review of RH request',lambda:call('review_request',{'request_id':req,'approve':True,'reason':'Exceptional RH review'},DIR))
    test('Second decision rejected',lambda:call('review_request',{'request_id':req,'approve':False,'reason':'again'},DIR,ok=False))
    req2=call('submit_request',{'person_id':uid(203),'version':1,'field':'display_name','value':'Professional request'},PRO)['id']
    test('Director cannot approve ordinary professional',lambda:call('review_request',{'request_id':req2,'approve':True,'reason':'not exceptional'},DIR,ok=False))
    test('RH reviews professional',lambda:call('review_request',{'request_id':req2,'approve':True,'reason':'RH review'},HR))
    test('Request cannot target another person',lambda:call('submit_request',{'person_id':person,'version':2,'field':'display_name','value':'Attack'},PRO,ok=False))
    test('Private read denied without specific grant',lambda:sql(f"select youcon_people.people_private_contacts('{O}','{person}')",DIR,False))
    call('edit_person',{'person_id':person,'version':2,'kind':'email','scope':'private','value':'private@exemplo.invalid'})
    test('Private field write denied for ordinary director',lambda:call('edit_person',{'person_id':person,'version':3,'kind':'email','scope':'private','value':'bad@exemplo.invalid'},DIR,ok=False))
    exported=sql(f"select youcon_people.people_export('{O}')",DIR)
    test('Management projection excludes private contacts',lambda:assert_('private@' not in exported and 'requester_user_id' not in exported))
    test('Audit events cannot be updated or deleted',lambda:[sql(f"{op} youcon_people.audit_events "+("set action='forged'" if op=='update' else ''),ok=False) for op in ['update','delete from']])
    test('Audit has authoritative actors and no contact values',lambda:assert_(sql("select count(*) from youcon_people.audit_events where actor_user_id is null or protected_diff::text like '%private@%'")=='0'))
    # transactional failure after partial function writes must roll back all side effects
    counts=sql('select (select count(*) from youcon_people.persons),(select count(*) from youcon_people.audit_events),(select count(*) from youcon_people.operation_receipts)')
    sql(f"begin;set local role authenticated;select youcon_people.people_create_person('{O}',gen_random_uuid(),'{{\"full_name\":\"Rollback Example\"}}');select 1/0;commit;",ok=False)
    test('Business, audit and receipt atomic rollback',lambda:assert_(counts==sql('select (select count(*) from youcon_people.persons),(select count(*) from youcon_people.audit_events),(select count(*) from youcon_people.operation_receipts)')))
    # real concurrent sessions; organization lock held by session one while session two waits
    cp=call('create_person',{'full_name':'Concurrent Example'})['id']
    payload=contract(cp); key=str(uuid.uuid4())
    def race(person,key1,key2):
        data=json.dumps(contract(person)).replace("'","''")
        def session(label,key,hold):
            return sql(f"set application_name='{label}';begin;select youcon_people.people_create_engagement('{O}','{key}','{data}');"+("select pg_sleep(4);" if hold else "")+"commit;",HR)
        def wait_activity(label,kind):
            for _ in range(40):
                if sql(f"select count(*) from pg_stat_activity where application_name='{label}' and wait_event_type='{kind}'")!='0':return True
                time.sleep(.02)
            return False
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            first=pool.submit(session,'race-first',key1,True)
            assert_(wait_activity('race-first','Timeout'))
            second=pool.submit(session,'race-second',key2,False)
            assert_(wait_activity('race-second','Lock'))
            r1=json.loads(first.result().splitlines()[0])
            try:r2=json.loads(second.result().splitlines()[0])
            except AssertionError as ex:
                if 'contract overlap' not in str(ex):raise
                r2='overlap'
        return r1,r2
    pair=race(cp,key,key)
    test('Concurrent duplicate submission blocks then replays identical result',lambda:assert_(pair[0]==pair[1] and sql(f"select count(*) from youcon_people.engagements where person_id='{cp}'")=='1'))
    cp2=call('create_person',{'full_name':'Overlap Concurrent'})['id']
    pair=race(cp2,str(uuid.uuid4()),str(uuid.uuid4()))
    test('Concurrent independent overlaps block then reject second transaction',lambda:assert_(pair[1]=='overlap' and sql(f"select count(*) from youcon_people.engagements where person_id='{cp2}'")=='1'))
    test('Repeatable-read rejected instead of stale integrity snapshot',lambda:sql(f"begin isolation level repeatable read;select youcon_people.people_create_person('{O}',gen_random_uuid(),'{{\"full_name\":\"Isolation Example\"}}');commit;",HR,False))
    # People-only access revocation and administrative exception
    account_person=uid(204)
    acct_e=call('create_engagement',contract(account_person))['id']
    sql(f"update youcon_people.access_exceptions set revoked_at=now() where user_id='{LEAD}'")
    test('Current contract allows People access',lambda:assert_(sql(f"select youcon_people_private.access_allowed('{O}')",LEAD)=='t'))
    call('close_engagement',{'engagement_id':acct_e,'version':1,'end':'2026-10-01','reason':'End access'})
    test('Closed contract blocks People and old memberships read',lambda:assert_(sql(f"select youcon_people_private.access_allowed('{O}')",LEAD)=='f' and sql('select count(*) from youcon_people.memberships',LEAD)=='0'))
    call('access_exception',{'person_id':account_person,'user_id':LEAD,'from':sql("select (now()-interval '1 hour')::text"),'to':'2029-01-01','reason':'Synthetic documented exception'})
    test('Documented exception allows People access only while valid',lambda:assert_(sql(f"select youcon_people_private.access_allowed('{O}')",LEAD)=='t'))
    sql(f"update youcon_people.access_exceptions set revoked_at=now() where user_id='{LEAD}'")
    test('Revoked exception immediately blocks People',lambda:assert_(sql(f"select youcon_people_private.access_allowed('{O}')",LEAD)=='f'))
    test('Other application metadata/data unchanged',lambda:assert_(before==sql("select md5(pg_get_triggerdef(oid)) from pg_trigger where tgname='legacy_auth';select * from public.legacy_sentinel;")))
    test('Executor cannot login, bypass RLS, create roles or alter tables',lambda:assert_(sql("select rolcanlogin or rolsuper or rolbypassrls or rolcreaterole or rolcreatedb from pg_roles where rolname='youcon_people_executor'")=='f'))
    test('No executable grants on internal command',lambda:assert_(sql("select has_function_privilege('authenticated','youcon_people_private.command(text,uuid,uuid,jsonb)','EXECUTE')")=='f'))
    test('Professional and leadership cannot SELECT Base',lambda:[assert_(sql('select count(*) from youcon_people.persons',actor)=='0') for actor in [PRO,LEAD]])
    test('Manager SELECT RLS excludes foreign organization',lambda:assert_(sql(f"select count(*) from youcon_people.persons where organization_id='{B}'",HR)=='0'))
    test('Anonymous cannot EXECUTE RPC',lambda:sql(f"set role anon;select youcon_people.people_directory('{O}')",ok=False))
    test('NULL version cannot bypass optimistic locking',lambda:call('edit_person',{'person_id':person,'version':None,'display_name':'Null version'},ok=False))
    test('Reused idempotency key with different body rejected',lambda:call('create_engagement',contract(cp,'pj'),key=key,ok=False))
    test('Closed contract cannot be reopened by DML',lambda:sql(f"update youcon_people.engagements set end_date=null where id='{e}'",ok=False))
    test('Name corrections retained only in protected audit',lambda:assert_(int(sql("select count(*) from youcon_people.audit_events where protected_diff ? 'before'"))>0))
    test('No private/raw payload in operation receipts',lambda:assert_(sql("select count(*) from youcon_people.operation_receipts where not payload ? 'sha256' or payload::text like '%private@%'")=='0'))
    # Role removal must deny exceptional review even if the snapshot was RH at submission.
    rr=call('submit_request',{'person_id':uid(205),'version':1,'field':'display_name','value':'Former RH'},HR2)['id']
    sql(f"delete from youcon_people.membership_roles where user_id='{HR2}' and role_code='hr'")
    test('Director cannot approve request after requester loses RH role',lambda:call('review_request',{'request_id':rr,'approve':True,'reason':'Role removed'},DIR,ok=False))
    # Conflict does not apply stale proposed values.
    rr=call('submit_request',{'person_id':uid(203),'version':2,'field':'display_name','value':'Stale requested'},PRO)['id']
    call('edit_person',{'person_id':uid(203),'version':2,'display_name':'New official'})
    call('review_request',{'request_id':rr,'approve':True,'reason':'Conflict review'})
    test('Version conflict records conflict and leaves official data intact',lambda:assert_(sql(f"select state from youcon_people.change_requests where id='{rr}'")=='conflict' and sql(f"select display_name from youcon_people.persons where id='{uid(203)}'")=='New official'))
    pp=call('create_person',{'full_name':'Supervised Intern'})['id']
    pe=call('create_engagement',{**contract(pp,'intern'), 'detail':{'supervisor_id':leader}})['id']
    test('Supervisor cannot end before supervised contract',lambda:call('close_engagement',{'engagement_id':leader,'version':1,'end':'2026-10-01','reason':'Would orphan supervision'},ok=False))
    sql(f"insert into youcon_people.units(id,organization_id,code,name) values('{uid(305)}','{O}','alternate','Alternate synthetic unit');update youcon_people.units set active=false where id='{uid(300)}'")
    test('Movement closes old assignment from inactive unit and uses active replacement',lambda:call('move_engagement',{'engagement_id':newe,'version':1,'date':'2026-10-15','unit_id':uid(305),'department_id':uid(301),'position_id':uid(303),'reason':'Unit retired'}))
    test('New assignment into inactive unit rejected',lambda:call('move_engagement',{'engagement_id':newe,'version':2,'date':'2026-10-16','unit_id':uid(300),'department_id':uid(301),'position_id':uid(303),'reason':'Invalid target'},ok=False))
    sql(f"update youcon_people.access_exceptions set revoked_at=null,valid_from=now()-interval '2 days',valid_to=now()-interval '1 day' where user_id='{LEAD}'")
    test('Expired administrative exceptions do not allow People access',lambda:assert_(sql(f"select youcon_people_private.access_allowed('{O}')",LEAD)=='f'))
    sql(f"update youcon_people.units set active=true where id='{uid(300)}'")
    fp=call('create_person',{'full_name':'Fixed term Example'})['id']
    fe=call('create_engagement',contract(fp,'intern','2026-01-01','2027-12-31'))['id']
    test('Move within fixed-term contract preserves planned boundary',lambda:call('move_engagement',{'engagement_id':fe,'version':1,'date':'2026-02-01','unit_id':uid(305),'department_id':uid(301),'position_id':uid(303),'reason':'Fixed term movement'}))
    test('Early closure distinguishes actual end from planned end',lambda:call('close_engagement',{'engagement_id':fe,'version':2,'end':'2026-10-01','reason':'Early fixed term closure'}))
    test('Planned contract endpoint remains historical after early closure',lambda:assert_(sql(f"select planned_end_date::text||'/'||end_date::text from youcon_people.engagements where id='{fe}'")=='2027-12-31/2026-10-01'))
    future=sql("select ((now() at time zone 'America/Sao_Paulo')::date + 365)::text")
    future_person=call('create_person',{'full_name':'Future access Example'})['id']
    call('create_engagement',contract(future_person,'intern',future))
    sql(f"insert into youcon_people.profiles(user_id,display_name) values('{uid(7)}','Synthetic Future');insert into youcon_people.memberships(id,organization_id,user_id,contract_type) values('{uid(107)}','{O}','{uid(7)}','intern');insert into youcon_people.membership_roles values('{uid(107)}','{uid(7)}','professional');")
    call('associate_account',{'person_id':future_person,'user_id':uid(7),'from':sql('select now()::text')})
    test('Scheduled contract cannot grant access before its start date',lambda:assert_(sql(f"select youcon_people_private.access_allowed('{O}')",uid(7))=='f'))
    sql(f"insert into youcon_people.units(id,organization_id,code,name) values('{uid(306)}','{B}','foreign-unit','Synthetic Foreign Unit')")
    foreign_catalog_person=call('create_person',{'full_name':'Foreign catalog attempt'})['id']
    test('Cross-organization catalog reference is rejected despite manager rights',lambda:assert_('inactive or foreign catalog' in call('create_engagement',{**contract(foreign_catalog_person),'unit_id':uid(306)},ok=False)))
    test('Cross-organization person reference is rejected despite manager rights',lambda:call('create_engagement',contract(uid(206)),ok=False))
    # Verify inherited unexpected ACL aborts the *exact* structural lot atomically.
    sql('create role legacy_probe;create database acl_probe;')
    def probe(q,ok=True):
        r=run(DOCKER+['exec','-i',name,'psql','-X','-U','postgres','-d','acl_probe','-v','ON_ERROR_STOP=1','-Atq'],input=q,text=True,capture_output=True)
        if ok and r.returncode:raise AssertionError(r.stderr)
        if not ok and not r.returncode:raise AssertionError('Expected inherited ACL rejection')
        return r.stdout.strip() if ok else r.stderr
    bootstrap=Path('tests/postgres/bootstrap.sql').read_text()
    bootstrap='\n'.join(line for line in bootstrap.splitlines() if not line.startswith('create role'))
    probe(bootstrap)
    probe(Path('supabase/migrations/20261110203914_youcon_people_shared_database_foundation.sql').read_text())
    probe('alter default privileges grant select on tables to legacy_probe;')
    rejection=probe(Path('docs/stage-03c-final/01-estrutura.sql.txt').read_text(),False)
    test('Unexpected inherited grant aborts structural lot without changing global defaults',lambda:assert_('unexpected inherited table grant' in rejection and probe("select to_regclass('youcon_people.persons') is null")=='t'))
    test('Director cannot directly SELECT movement reasons or account identifiers',lambda:[sql(f"select {column} from youcon_people.{table}",DIR,False) for table,column in [('engagement_assignments','reason'),('persons','created_by')]])
    history=json.loads(sql(f"select youcon_people.people_history('{O}','{person}')",DIR))
    test('History projection includes movements without private reasons',lambda:assert_(len(history['movements'])>=2 and 'reason' not in json.dumps(history)))
    # Repeat the exact structural/function lots under unexpected function defaults in the probe DB.
    probe('alter default privileges revoke select on tables from legacy_probe;')
    probe('\n'.join(line for line in Path('docs/stage-03c-final/00-executor.sql.txt').read_text().splitlines() if not line.startswith('create role')))
    probe(Path('docs/stage-03c-final/01-estrutura.sql.txt').read_text())
    probe(Path('docs/stage-03c-final/02-integridade.sql.txt').read_text())
    probe('alter default privileges grant execute on functions to legacy_probe;')
    rejection=probe(Path('docs/stage-03c-final/03-funcoes.sql.txt').read_text(),False)
    test('Unexpected inherited EXECUTE aborts privileged function lot atomically',lambda:assert_('unexpected inherited function grant' in rejection and probe("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='youcon_people_private' and p.proname='command'")=='0'))
    test('Own management edits cannot bypass the no-self-approval workflow',lambda:[call('edit_person',{'person_id':uid(200+i),'version':1,'display_name':'Self bypass'},uid(i),ok=False) for i in [1,2]])
    test('Administrative exception cannot use PostgreSQL infinity as an expiry',lambda:call('access_exception',{'person_id':uid(203),'user_id':PRO,'from':sql("select (now()-interval '1 hour')::text"),'to':'infinity','reason':'Infinite attempt'},ok=False))
    # Switching account IDs cannot turn a request into an approvable request by the same person.
    ownreq=call('submit_request',{'person_id':uid(201),'version':2,'field':'display_name','value':'Same person new login'},HR)['id']
    sql(f"update youcon_people.person_accounts set valid_to=now() where user_id in ('{HR}','{HR2}') and valid_to is null;insert into youcon_people.person_accounts(organization_id,person_id,user_id,valid_from) values('{O}','{uid(201)}','{HR2}',now());insert into youcon_people.membership_roles values('{uid(105)}','{HR2}','hr');insert into youcon_people.access_exceptions(organization_id,person_id,user_id,valid_from,valid_to,reason,approved_by) values('{O}','{uid(201)}','{HR2}',now(),now()+interval '1 year','Synthetic account rotation','{uid(9)}');")
    test('Account rotation cannot bypass self-person approval check',lambda:assert_('no self-person approval' in call('review_request',{'request_id':ownreq,'approve':True,'reason':'Same person'},HR2,ok=False)))
    test('Exception tied to closed association does not keep old account eligible',lambda:assert_(sql(f"select youcon_people_private.access_allowed('{O}')",HR)=='f'))
    business_count=sql('select count(*) from youcon_people.engagements')
    sql(Path('docs/stage-03c-final/R1-quarentena.sql.txt').read_text())
    test('Exact quarantine SQL disables new endpoints and preserves data and revocation',lambda:assert_(bool(sql(f"select youcon_people.people_directory('{O}')",HR,False)) and business_count==sql('select count(*) from youcon_people.engagements') and sql('select count(*) from youcon_people.memberships',LEAD)=='0'))
    sql(Path('docs/stage-03c-final/R2-elegibilidade-legada.sql.txt').read_text())
    test('Separately authorized eligibility backout restores legacy behavior without touching Auth',lambda:assert_(sql('select count(*) from youcon_people.memberships',LEAD)=='1' and before==sql("select md5(pg_get_triggerdef(oid)) from pg_trigger where tgname='legacy_auth';select * from public.legacy_sentinel;")))
    report={'status':'PASS','postgres':sql('select version()'),'network':'none; Unix socket via local Docker exec; no remote connection string','tests':results,'count':len(results),'sql_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in lots+sorted(Path('docs/stage-03c-final').glob('R*.sql.txt'))}}
    Path('docs/stage-03c-final/TESTES.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':'PASS','tests':len(results)}))
finally:
    run(DOCKER+['rm','-f',name],capture_output=True)
