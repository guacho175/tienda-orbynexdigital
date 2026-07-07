export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      order_items: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_slug: string;
          quantity: number;
          subtotal: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_slug: string;
          quantity: number;
          subtotal: number;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          order_id?: string;
          product_id?: string;
          product_name?: string;
          product_slug?: string;
          quantity?: number;
          subtotal?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          commerce_order: string;
          confirmed_at: string | null;
          created_at: string;
          currency: string;
          customer_comment: string | null;
          customer_email: string;
          customer_name: string;
          customer_phone: string | null;
          discount_total: number;
          expires_at: string | null;
          failed_at: string | null;
          flow_raw_status: Json | null;
          flow_status: string | null;
          flow_token: string | null;
          flow_url: string | null;
          id: string;
          paid_at: string | null;
          public_lookup_token: string;
          shipping_total: number;
          status: string;
          subtotal: number;
          tax_total: number;
          total: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          commerce_order: string;
          confirmed_at?: string | null;
          created_at?: string;
          currency?: string;
          customer_comment?: string | null;
          customer_email: string;
          customer_name: string;
          customer_phone?: string | null;
          discount_total?: number;
          expires_at?: string | null;
          failed_at?: string | null;
          flow_raw_status?: Json | null;
          flow_status?: string | null;
          flow_token?: string | null;
          flow_url?: string | null;
          id?: string;
          paid_at?: string | null;
          public_lookup_token?: string;
          shipping_total?: number;
          status?: string;
          subtotal?: number;
          tax_total?: number;
          total: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          commerce_order?: string;
          confirmed_at?: string | null;
          created_at?: string;
          currency?: string;
          customer_comment?: string | null;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string | null;
          discount_total?: number;
          expires_at?: string | null;
          failed_at?: string | null;
          flow_raw_status?: Json | null;
          flow_status?: string | null;
          flow_token?: string | null;
          flow_url?: string | null;
          id?: string;
          paid_at?: string | null;
          public_lookup_token?: string;
          shipping_total?: number;
          status?: string;
          subtotal?: number;
          tax_total?: number;
          total?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          availability: string;
          category: string | null;
          created_at: string;
          currency: string;
          description: string | null;
          display_order: number;
          id: string;
          image_url: string | null;
          image_url_card: string | null;
          image_url_detail: string | null;
          image_url_thumb: string | null;
          is_active: boolean;
          allow_backorder: boolean;
          low_stock_threshold: number;
          name: string;
          out_of_stock_behavior: string;
          payment_button_label: string | null;
          payment_url: string | null;
          price: number;
          short_description: string | null;
          slug: string;
          stock_quantity: number;
          track_inventory: boolean;
          updated_at: string;
        };
        Insert: {
          availability?: string;
          allow_backorder?: boolean;
          category?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          image_url_card?: string | null;
          image_url_detail?: string | null;
          image_url_thumb?: string | null;
          is_active?: boolean;
          low_stock_threshold?: number;
          name: string;
          out_of_stock_behavior?: string;
          payment_button_label?: string | null;
          payment_url?: string | null;
          price?: number;
          short_description?: string | null;
          slug: string;
          stock_quantity?: number;
          track_inventory?: boolean;
          updated_at?: string;
        };
        Update: {
          availability?: string;
          allow_backorder?: boolean;
          category?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          image_url_card?: string | null;
          image_url_detail?: string | null;
          image_url_thumb?: string | null;
          is_active?: boolean;
          low_stock_threshold?: number;
          name?: string;
          out_of_stock_behavior?: string;
          payment_button_label?: string | null;
          payment_url?: string | null;
          price?: number;
          short_description?: string | null;
          slug?: string;
          stock_quantity?: number;
          track_inventory?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_reservations: {
        Row: {
          confirmed_at: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          released_at: string | null;
          status: string;
        };
        Insert: {
          confirmed_at?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          released_at?: string | null;
          status?: string;
        };
        Update: {
          confirmed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          released_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_reservations_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      confirm_order_payment_and_capture_stock: {
        Args: {
          p_flow_status: Json;
          p_flow_status_text?: string;
          p_order_id: string;
        };
        Returns: {
          message: string;
          status: string;
          success: boolean;
        }[];
      };
      confirm_order_and_decrement_stock: {
        Args: {
          p_flow_status: Json;
          p_flow_status_text?: string;
          p_order_id: string;
        };
        Returns: {
          message: string;
          success: boolean;
        }[];
      };
      create_order_with_stock_reservation: {
        Args: {
          p_commerce_order: string;
          p_customer: Json;
          p_items: Json;
          p_reservation_minutes?: number;
          p_user_id: string | null;
        };
        Returns: {
          commerce_order: string;
          currency: string;
          order_id: string;
          public_lookup_token: string;
          subtotal: number;
          total: number;
        }[];
      };
      expire_stock_reservations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          expired_orders: number;
          expired_reservations: number;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      release_order_stock_reservations: {
        Args: {
          p_flow_status?: Json;
          p_flow_status_text?: string;
          p_order_id: string;
          p_order_status?: string;
        };
        Returns: {
          message: string;
          released_count: number;
          status: string;
          success: boolean;
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
