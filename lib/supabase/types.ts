export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          accent_color: string
          created_at: string
          id: string
          locale: string
          logo_url: string | null
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          id?: string
          locale?: string
          logo_url?: string | null
          name: string
          primary_color?: string
          secondary_color?: string
          slug: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          id?: string
          locale?: string
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string | null
          preferences: Json
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_adjustment_requests: {
        Row: {
          id: string
          message: string
          proposal_id: string
          requested_at: string
          resolved_at: string | null
          session_hash: string
          tenant_id: string
        }
        Insert: {
          id?: string
          message: string
          proposal_id: string
          requested_at?: string
          resolved_at?: string | null
          session_hash: string
          tenant_id: string
        }
        Update: {
          id?: string
          message?: string
          proposal_id?: string
          requested_at?: string
          resolved_at?: string | null
          session_hash?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_adjustment_requests_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_adjustment_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_approval_snapshots: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          session_hash: string
          snapshot: Json
          tenant_id: string
          terms_version: number
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          session_hash: string
          snapshot: Json
          tenant_id: string
          terms_version: number
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          session_hash?: string
          snapshot?: Json
          tenant_id?: string
          terms_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_approval_snapshots_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: true
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_approval_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          position: number
          price_delta: number
          section_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          position?: number
          price_delta?: number
          section_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          position?: number
          price_delta?: number
          section_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "proposal_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_sections: {
        Row: {
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["proposal_section_mode"]
          position: number
          proposal_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["proposal_section_mode"]
          position?: number
          proposal_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["proposal_section_mode"]
          position?: number
          proposal_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          approved_at: string | null
          base_amount: number
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          owner_id: string
          status: Database["public"]["Enums"]["proposal_status"]
          tenant_id: string
          terms_version: number
          title: string
          token_hash: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          base_amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["proposal_status"]
          tenant_id: string
          terms_version?: number
          title?: string
          token_hash?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          base_amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          tenant_id?: string
          terms_version?: number
          title?: string
          token_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tmp_t: {
        Row: {
          id: number | null
        }
        Insert: {
          id?: number | null
        }
        Update: {
          id?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_public_proposal: {
        Args: {
          p_selection: Json
          p_session_id: string
          p_terms_accepted: boolean
          p_terms_version: number
          p_token_hash: string
        }
        Returns: Json
      }
      current_organization_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_public_proposal: { Args: { p_token_hash: string }; Returns: Json }
      request_public_adjustment: {
        Args: { p_message: string; p_session_id: string; p_token_hash: string }
        Returns: Json
      }
      tmp_fn: { Args: never; Returns: number }
    }
    Enums: {
      proposal_section_mode: "single" | "multiple"
      proposal_status:
        | "draft"
        | "sent"
        | "viewed"
        | "revision_requested"
        | "approved"
        | "expired"
      user_role: "OWNER" | "ADMIN" | "MEMBER" | "GUEST"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      proposal_section_mode: ["single", "multiple"],
      proposal_status: [
        "draft",
        "sent",
        "viewed",
        "revision_requested",
        "approved",
        "expired",
      ],
      user_role: ["OWNER", "ADMIN", "MEMBER", "GUEST"],
    },
  },
} as const

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
