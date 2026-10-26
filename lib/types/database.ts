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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: number
          is_demo: boolean
          meta: Json
          path: string | null
          privacy_ok: boolean
          service_id: string | null
          session_id: string | null
          source: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: never
          is_demo?: boolean
          meta?: Json
          path?: string | null
          privacy_ok?: boolean
          service_id?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: never
          is_demo?: boolean
          meta?: Json
          path?: string | null
          privacy_ok?: boolean
          service_id?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          data: Json
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          data?: Json
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          data?: Json
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
          sort: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
          sort?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      cost_entries: {
        Row: {
          amount: number
          basis: string
          cost_type: string
          created_at: string
          created_by: string | null
          id: string
          incurred_on: string
          is_demo: boolean
          label: string
        }
        Insert: {
          amount: number
          basis?: string
          cost_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          incurred_on: string
          is_demo?: boolean
          label: string
        }
        Update: {
          amount?: number
          basis?: string
          cost_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          incurred_on?: string
          is_demo?: boolean
          label?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          comm_prefs: Json
          consent_at: string | null
          created_at: string
          email: string | null
          id: string
          is_demo: boolean
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comm_prefs?: Json
          consent_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comm_prefs?: Json
          consent_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          assigned_at: string | null
          assist_fee: number
          assist_opt_in: boolean
          category_id: string | null
          created_at: string
          customer_id: string
          details: Json
          id: string
          idempotency_key: string | null
          is_demo: boolean
          locality: string | null
          preferred_date: string | null
          preferred_time: string | null
          ref_code: string
          request: string
          requested_vendor_id: string | null
          service_id: string | null
          source: string
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assist_fee?: number
          assist_opt_in?: boolean
          category_id?: string | null
          created_at?: string
          customer_id: string
          details?: Json
          id?: string
          idempotency_key?: string | null
          is_demo?: boolean
          locality?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          ref_code?: string
          request: string
          requested_vendor_id?: string | null
          service_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assist_fee?: number
          assist_opt_in?: boolean
          category_id?: string | null
          created_at?: string
          customer_id?: string
          details?: Json
          id?: string
          idempotency_key?: string | null
          is_demo?: boolean
          locality?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          ref_code?: string
          request?: string
          requested_vendor_id?: string | null
          service_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_requested_vendor_id_fkey"
            columns: ["requested_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiry_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          enquiry_id: string
          from_status: Database["public"]["Enums"]["enquiry_status"] | null
          id: number
          note: string | null
          to_status: Database["public"]["Enums"]["enquiry_status"] | null
          vendor_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          enquiry_id: string
          from_status?: Database["public"]["Enums"]["enquiry_status"] | null
          id?: never
          note?: string | null
          to_status?: Database["public"]["Enums"]["enquiry_status"] | null
          vendor_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          enquiry_id?: string
          from_status?: Database["public"]["Enums"]["enquiry_status"] | null
          id?: never
          note?: string | null
          to_status?: Database["public"]["Enums"]["enquiry_status"] | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_events_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiry_events_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          notify_updates: boolean
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          notify_updates?: boolean
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          notify_updates?: boolean
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          audience: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: number
          note: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          note?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          note?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_transitions: {
        Row: {
          actor: string
          from_status: Database["public"]["Enums"]["order_status"]
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor: string
          from_status: Database["public"]["Enums"]["order_status"]
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor?: string
          from_status?: Database["public"]["Enums"]["order_status"]
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: []
      }
      orders: {
        Row: {
          accepted_at: string | null
          agreed_amount: number | null
          cancelled_at: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          customer_display_name: string | null
          customer_id: string
          declined_at: string | null
          enquiry_id: string
          first_response_at: string | null
          id: string
          is_demo: boolean
          notes: string | null
          ref_code: string
          scheduled_for: string | null
          scope: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          accepted_at?: string | null
          agreed_amount?: number | null
          cancelled_at?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_display_name?: string | null
          customer_id: string
          declined_at?: string | null
          enquiry_id: string
          first_response_at?: string | null
          id?: string
          is_demo?: boolean
          notes?: string | null
          ref_code?: string
          scheduled_for?: string | null
          scope?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          accepted_at?: string | null
          agreed_amount?: number | null
          cancelled_at?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_display_name?: string | null
          customer_id?: string
          declined_at?: string | null
          enquiry_id?: string
          first_response_at?: string | null
          id?: string
          is_demo?: boolean
          notes?: string | null
          ref_code?: string
          scheduled_for?: string | null
          scope?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          evidence_url: string | null
          id: string
          is_demo: boolean
          method: string
          order_id: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string | null
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          evidence_url?: string | null
          id?: string
          is_demo?: boolean
          method: string
          order_id: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          evidence_url?: string | null
          id?: string
          is_demo?: boolean
          method?: string
          order_id?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ledger: {
        Row: {
          amount: number
          basis: string
          created_at: string
          created_by: string | null
          direct_cost: number
          enquiry_id: string | null
          id: string
          is_demo: boolean
          note: string | null
          order_id: string | null
          recognized_on: string
          reconciliation: string
          tax_amount: number
          txn_type: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          basis?: string
          created_at?: string
          created_by?: string | null
          direct_cost?: number
          enquiry_id?: string | null
          id?: string
          is_demo?: boolean
          note?: string | null
          order_id?: string | null
          recognized_on?: string
          reconciliation?: string
          tax_amount?: number
          txn_type: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          basis?: string
          created_at?: string
          created_by?: string | null
          direct_cost?: number
          enquiry_id?: string | null
          id?: string
          is_demo?: boolean
          note?: string | null
          order_id?: string | null
          recognized_on?: string
          reconciliation?: string
          tax_amount?: number
          txn_type?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_ledger_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_ledger_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          read_only: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          read_only?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          read_only?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          body: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_demo: boolean
          order_id: string | null
          rating: number
          status: Database["public"]["Enums"]["moderation_status"]
          user_id: string | null
          vendor_id: string
        }
        Insert: {
          author_name: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_demo?: boolean
          order_id?: string | null
          rating: number
          status?: Database["public"]["Enums"]["moderation_status"]
          user_id?: string | null
          vendor_id: string
        }
        Update: {
          author_name?: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_demo?: boolean
          order_id?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["moderation_status"]
          user_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          attributes: Json
          availability: string | null
          category_id: string | null
          created_at: string
          delivery_options: string[]
          description: string | null
          id: string
          image_url: string | null
          is_demo: boolean
          lead_time: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation: Database["public"]["Enums"]["moderation_status"]
          moderation_note: string | null
          price_amount: number | null
          price_type: string
          price_unit: string | null
          sort: number
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          attributes?: Json
          availability?: string | null
          category_id?: string | null
          created_at?: string
          delivery_options?: string[]
          description?: string | null
          id?: string
          image_url?: string | null
          is_demo?: boolean
          lead_time?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation?: Database["public"]["Enums"]["moderation_status"]
          moderation_note?: string | null
          price_amount?: number | null
          price_type?: string
          price_unit?: string | null
          sort?: number
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          attributes?: Json
          availability?: string | null
          category_id?: string | null
          created_at?: string
          delivery_options?: string[]
          description?: string | null
          id?: string
          image_url?: string | null
          is_demo?: boolean
          lead_time?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation?: Database["public"]["Enums"]["moderation_status"]
          moderation_note?: string | null
          price_amount?: number | null
          price_type?: string
          price_unit?: string | null
          sort?: number
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          consent_at: string | null
          created_at: string
          details: Json
          email: string | null
          id: string
          is_demo: boolean
          linked_id: string | null
          linked_type: string | null
          message: string
          name: string
          owner_id: string | null
          phone: string | null
          queue: string
          ref_code: string
          status: Database["public"]["Enums"]["ticket_status"]
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          consent_at?: string | null
          created_at?: string
          details?: Json
          email?: string | null
          id?: string
          is_demo?: boolean
          linked_id?: string | null
          linked_type?: string | null
          message: string
          name: string
          owner_id?: string | null
          phone?: string | null
          queue?: string
          ref_code?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          topic: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          consent_at?: string | null
          created_at?: string
          details?: Json
          email?: string | null
          id?: string
          is_demo?: boolean
          linked_id?: string | null
          linked_type?: string | null
          message?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          queue?: string
          ref_code?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      vendor_categories: {
        Row: {
          category_id: string
          vendor_id: string
        }
        Insert: {
          category_id: string
          vendor_id: string
        }
        Update: {
          category_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_categories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation: Database["public"]["Enums"]["moderation_status"]
          moderation_note: string | null
          sort: number
          url: string
          vendor_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation?: Database["public"]["Enums"]["moderation_status"]
          moderation_note?: string | null
          sort?: number
          url: string
          vendor_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation?: Database["public"]["Enums"]["moderation_status"]
          moderation_note?: string | null
          sort?: number
          url?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_media_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_members: {
        Row: {
          created_at: string
          member_role: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          member_role?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          member_role?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_members_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_updates: {
        Row: {
          body: string | null
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation: Database["public"]["Enums"]["moderation_status"]
          moderation_note: string | null
          title: string
          vendor_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation?: Database["public"]["Enums"]["moderation_status"]
          moderation_note?: string | null
          title: string
          vendor_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation?: Database["public"]["Enums"]["moderation_status"]
          moderation_note?: string | null
          title?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_updates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          avatar_url: string | null
          city: string
          cover_url: string | null
          created_at: string
          description: string | null
          highlights: string[]
          id: string
          is_demo: boolean
          key_terms: string | null
          languages: string[]
          locality: string | null
          name: string
          owner_user_id: string | null
          primary_category_id: string | null
          removed_at: string | null
          removed_reason: string | null
          service_area: string[]
          slug: string
          status: Database["public"]["Enums"]["vendor_status"]
          tagline: string | null
          updated_at: string
          verification: Database["public"]["Enums"]["verification_status"]
          verification_checks: Json
          verified_at: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          highlights?: string[]
          id?: string
          is_demo?: boolean
          key_terms?: string | null
          languages?: string[]
          locality?: string | null
          name: string
          owner_user_id?: string | null
          primary_category_id?: string | null
          removed_at?: string | null
          removed_reason?: string | null
          service_area?: string[]
          slug: string
          status?: Database["public"]["Enums"]["vendor_status"]
          tagline?: string | null
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
          verification_checks?: Json
          verified_at?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          highlights?: string[]
          id?: string
          is_demo?: boolean
          key_terms?: string | null
          languages?: string[]
          locality?: string | null
          name?: string
          owner_user_id?: string | null
          primary_category_id?: string | null
          removed_at?: string | null
          removed_reason?: string | null
          service_area?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["vendor_status"]
          tagline?: string | null
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
          verification_checks?: Json
          verified_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _assign_enquiry: {
        Args: { p_enquiry: string; p_note: string; p_vendor: string }
        Returns: {
          accepted_at: string | null
          agreed_amount: number | null
          cancelled_at: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          customer_display_name: string | null
          customer_id: string
          declined_at: string | null
          enquiry_id: string
          first_response_at: string | null
          id: string
          is_demo: boolean
          notes: string | null
          ref_code: string
          scheduled_for: string | null
          scope: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          vendor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _range_end: { Args: { d: string }; Returns: string }
      _range_start: { Args: { d: string }; Returns: string }
      admin_add_enquiry_note: {
        Args: { p_enquiry: string; p_note: string }
        Returns: undefined
      }
      admin_assign_enquiry: {
        Args: { p_enquiry: string; p_note?: string; p_vendor: string }
        Returns: {
          accepted_at: string | null
          agreed_amount: number | null
          cancelled_at: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          customer_display_name: string | null
          customer_id: string
          declined_at: string | null
          enquiry_id: string
          first_response_at: string | null
          id: string
          is_demo: boolean
          notes: string | null
          ref_code: string
          scheduled_for: string | null
          scope: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          vendor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_erase_user: {
        Args: { p_reason: string; p_user: string }
        Returns: undefined
      }
      admin_link_vendor_member: {
        Args: { p_email: string; p_vendor: string }
        Returns: undefined
      }
      admin_list_users: {
        Args: {
          p_blocked?: boolean
          p_limit?: number
          p_offset?: number
          p_role?: Database["public"]["Enums"]["app_role"]
          p_search?: string
        }
        Returns: {
          blocked_at: string
          blocked_reason: string
          created_at: string
          email: string
          enquiries: number
          full_name: string
          id: string
          last_sign_in_at: string
          phone: string
          read_only: boolean
          role: Database["public"]["Enums"]["app_role"]
          total: number
          vendor_name: string
        }[]
      }
      admin_metrics: {
        Args: {
          p_category?: string
          p_from: string
          p_locality?: string
          p_to: string
          p_vendor?: string
        }
        Returns: Json
      }
      admin_moderate: {
        Args: {
          p_action: string
          p_id: string
          p_kind: string
          p_note?: string
        }
        Returns: undefined
      }
      admin_remove_vendor: {
        Args: { p_permanent?: boolean; p_reason: string; p_vendor: string }
        Returns: string
      }
      admin_set_enquiry_status: {
        Args: {
          p_enquiry: string
          p_note?: string
          p_status: Database["public"]["Enums"]["enquiry_status"]
        }
        Returns: undefined
      }
      admin_set_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user: string
        }
        Returns: undefined
      }
      admin_set_user_blocked: {
        Args: { p_blocked: boolean; p_reason?: string; p_user: string }
        Returns: undefined
      }
      admin_set_vendor_status: {
        Args: {
          p_note?: string
          p_status: Database["public"]["Enums"]["vendor_status"]
          p_vendor: string
        }
        Returns: undefined
      }
      admin_set_verification: {
        Args: { p_checks: Json; p_vendor: string }
        Returns: Database["public"]["Enums"]["verification_status"]
      }
      admin_update_ticket: {
        Args: {
          p_assign_me?: boolean
          p_status: Database["public"]["Enums"]["ticket_status"]
          p_ticket: string
        }
        Returns: undefined
      }
      boost_queue: {
        Args: { p_from: string; p_to: string }
        Returns: {
          action: string
          metrics: Json
          reason: string
          rule: string
          severity: string
          vendor_id: string
          vendor_name: string
          vendor_slug: string
        }[]
      }
      commercial_summary: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      create_vendor_application: { Args: { p: Json }; Returns: Json }
      gen_ref: { Args: { prefix: string }; Returns: string }
      hit_rate_limit: {
        Args: { p_key: string; p_max: number; p_window: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_blocked: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_staff_writer: { Args: never; Returns: boolean }
      is_vendor_member: { Args: { v: string }; Returns: boolean }
      listing_completeness: { Args: { p_vendor: string }; Returns: number }
      log_event: {
        Args: {
          p_meta?: Json
          p_path?: string
          p_service?: string
          p_session?: string
          p_source?: string
          p_type: string
          p_vendor?: string
        }
        Returns: undefined
      }
      mark_notifications_read: {
        Args: { p_ids?: string[] }
        Returns: undefined
      }
      moderation_required: { Args: never; Returns: boolean }
      my_customer_ids: { Args: never; Returns: string[] }
      my_role: { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
      my_vendor_ids: { Args: never; Returns: string[] }
      notify: {
        Args: {
          p_audience: string
          p_body: string
          p_link: string
          p_title: string
          p_user: string
          p_vendor: string
        }
        Returns: undefined
      }
      order_contact: { Args: { p_order: string }; Returns: Json }
      purge_rate_limits: { Args: never; Returns: undefined }
      record_payment: {
        Args: {
          p_amount: number
          p_evidence?: string
          p_method: string
          p_order: string
          p_ref?: string
        }
        Returns: {
          amount: number
          created_at: string
          evidence_url: string | null
          id: string
          is_demo: boolean
          method: string
          order_id: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string | null
          updated_at: string
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      slugify: { Args: { p: string }; Returns: string }
      staff_set_payment_status: {
        Args: {
          p_payment: string
          p_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: undefined
      }
      submit_enquiry: { Args: { p: Json }; Returns: Json }
      submit_review: {
        Args: { p_body: string; p_order: string; p_rating: number }
        Returns: undefined
      }
      submit_ticket: { Args: { p: Json }; Returns: Json }
      transition_order: {
        Args: {
          p_note?: string
          p_order: string
          p_to: Database["public"]["Enums"]["order_status"]
        }
        Returns: {
          accepted_at: string | null
          agreed_amount: number | null
          cancelled_at: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          customer_display_name: string | null
          customer_id: string
          declined_at: string | null
          enquiry_id: string
          first_response_at: string | null
          id: string
          is_demo: boolean
          notes: string | null
          ref_code: string
          scheduled_for: string | null
          scope: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          vendor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      vendor_metrics: {
        Args: { p_from: string; p_to: string; p_vendor: string }
        Returns: Json
      }
      vendor_update_order: {
        Args: {
          p_amount: number
          p_notes: string
          p_order: string
          p_scheduled: string
          p_scope: string
        }
        Returns: {
          accepted_at: string | null
          agreed_amount: number | null
          cancelled_at: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          customer_display_name: string | null
          customer_id: string
          declined_at: string | null
          enquiry_id: string
          first_response_at: string | null
          id: string
          is_demo: boolean
          notes: string | null
          ref_code: string
          scheduled_for: string | null
          scope: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          vendor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      write_audit: {
        Args: {
          p_action: string
          p_data?: Json
          p_entity: string
          p_entity_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "admin" | "finance"
      enquiry_status:
        | "new"
        | "assigned"
        | "in_fulfilment"
        | "closed"
        | "cancelled"
        | "spam"
      moderation_status: "pending" | "approved" | "rejected"
      order_status:
        | "new"
        | "accepted"
        | "declined"
        | "in_progress"
        | "completed"
        | "payment_recorded"
        | "submitted"
        | "closed"
        | "cancelled"
      payment_status: "recorded" | "verified" | "rejected"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      vendor_status:
        | "draft"
        | "pending"
        | "active"
        | "paused"
        | "rejected"
        | "removed"
      verification_status: "unverified" | "pending" | "verified"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "vendor", "admin", "finance"],
      enquiry_status: [
        "new",
        "assigned",
        "in_fulfilment",
        "closed",
        "cancelled",
        "spam",
      ],
      moderation_status: ["pending", "approved", "rejected"],
      order_status: [
        "new",
        "accepted",
        "declined",
        "in_progress",
        "completed",
        "payment_recorded",
        "submitted",
        "closed",
        "cancelled",
      ],
      payment_status: ["recorded", "verified", "rejected"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      vendor_status: [
        "draft",
        "pending",
        "active",
        "paused",
        "rejected",
        "removed",
      ],
      verification_status: ["unverified", "pending", "verified"],
    },
  },
} as const
