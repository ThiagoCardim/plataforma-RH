"""Only moves the fixed Preview alias. No build, promotion, merge or database access."""
import json
import os
import re
import urllib.error
import urllib.request

TEAM = "team_7GKdyWHAUAJ7Se6HMSzP7USo"
PROJECT = "prj_XvEhxHGub2ILTIbGu9drQ4ikB3P8"
ALIAS = "youcon-people-preview.vercel.app"


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def api(path, token, body=None):
    request = urllib.request.Request(
        f"https://api.vercel.com{path}?teamId={TEAM}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        data=None if body is None else json.dumps(body).encode(),
        method="GET" if body is None else "POST",
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.load(response)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def protected(host):
    # No credentials, cookies, redirects or protection bypass headers.
    request = urllib.request.Request(f"https://{host}/politicas-internas")
    try:
        urllib.request.build_opener(NoRedirect()).open(request, timeout=25).close()
    except urllib.error.HTTPError as error:
        require(error.code == 401 and bool(error.headers.get("x-vercel-id")),
                "A proteção Vercel não foi confirmada (esperado HTTP 401).")
        return
    raise RuntimeError("O endereço respondeu sem exigir a autenticação Vercel.")


def validate(deployment, sha):
    require(deployment.get("readyState") == "READY", "Deployment ainda não está READY.")
    require(deployment.get("target") is None, "Somente deployments de Preview são aceitos.")
    require(deployment.get("projectId", deployment.get("project", {}).get("id")) == PROJECT,
            "Projeto diferente do autorizado.")
    meta = deployment.get("meta", {})
    require(meta.get("githubCommitSha") == sha, "SHA diferente do aprovado.")
    require(meta.get("githubOrg") == "ThiagoCardim" and meta.get("githubRepo") == "plataforma-RH",
            "Repositório diferente do autorizado.")
    host = deployment.get("url", "")
    require(re.fullmatch(r"[a-z0-9-]+\.vercel\.app", host), "Hostname inválido.")


def move(token, deployment_id, sha):
    require(re.fullmatch(r"dpl_[A-Za-z0-9]+", deployment_id), "ID inválido.")
    require(re.fullmatch(r"[a-f0-9]{40}", sha), "Informe o SHA completo.")
    project = api(f"/v9/projects/{PROJECT}", token)
    require(project.get("ssoProtection", {}).get("deploymentType") in
            ("all_except_custom_domains", "all"), "Proteção Vercel precisa estar ativa.")
    deployment = api(f"/v13/deployments/{deployment_id}", token)
    validate(deployment, sha)
    protected(deployment["url"])
    previous = api(f"/v4/aliases/{ALIAS}", token)
    require(previous.get("projectId") == PROJECT, "Alias pertence a outro projeto.")
    previous_id = previous.get("deploymentId") or previous.get("deployment", {}).get("id")
    require(previous_id and re.fullmatch(r"dpl_[A-Za-z0-9]+", previous_id), "Destino anterior não identificado.")
    protected(ALIAS)
    print(f"Destino anterior para recuperação: {previous_id}", flush=True)
    # The Vercel alias assignment replaces the destination; never delete the alias.
    try:
        api(f"/v2/deployments/{deployment_id}/aliases", token, {"alias": ALIAS})
        current = api(f"/v4/aliases/{ALIAS}", token)
        require((current.get("deploymentId") or current.get("deployment", {}).get("id")) == deployment_id,
                "Alias não aponta para o deployment aprovado.")
        protected(ALIAS)
    except Exception:
        api(f"/v2/deployments/{previous_id}/aliases", token, {"alias": ALIAS})
        restored = api(f"/v4/aliases/{ALIAS}", token)
        require((restored.get("deploymentId") or restored.get("deployment", {}).get("id")) == previous_id,
                f"Recuperação pendente: restaurar alias ao deployment {previous_id}.")
        raise RuntimeError("Atualização falhou; destino anterior restaurado.") from None
    print(f"Preview aprovada: https://{ALIAS} — {sha}")


if __name__ == "__main__":
    token = os.environ.get("VERCEL_TOKEN", "")
    require(token, "Configure o secret YOUCON_PREVIEW_VERCEL_TOKEN no GitHub.")
    move(token, os.environ.get("APPROVED_DEPLOYMENT", ""), os.environ.get("APPROVED_SHA", ""))
