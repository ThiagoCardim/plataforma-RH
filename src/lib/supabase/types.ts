// Initial schema contract. Regenerate with Supabase CLI after applying migrations.
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      organizations: Table<{
        id: string;
        name: string;
        slug: string;
        created_at: string;
      }>;
      profiles: Table<{
        user_id: string;
        display_name: string | null;
        created_at: string;
      }>;
      memberships: Table<{
        id: string;
        organization_id: string;
        user_id: string;
        contract_type: "clt" | "intern" | "pj";
        active: boolean;
        created_at: string;
      }>;
      roles: Table<{ code: string; label: string }>;
      permissions: Table<{ code: string; description: string }>;
      role_permissions: Table<{ role_code: string; permission_code: string }>;
      membership_roles: Table<{
        membership_id: string;
        user_id: string;
        role_code: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
