// Types générés manuellement depuis le schéma supabase/schema.sql
// Régénérer avec : npx supabase gen types typescript --project-id <ID> > types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      product_placement_presets: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string
          url: string
          image: string
          cta: string
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description?: string
          url: string
          image?: string
          cta?: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          url?: string
          image?: string
          cta?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_placement_presets_author_id_fkey'
            columns: ['author_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string
          role: string
          avatar_url: string | null
          cover_color: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string
          role?: string
          avatar_url?: string | null
          cover_color?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          role?: string
          avatar_url?: string | null
          cover_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_clicks: {
        Row: {
          id: string
          article_id: string
          session_id: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          session_id: string
          source?: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'product_clicks_article_id_fkey'
            columns: ['article_id']
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
        ]
      }
      page_views: {
        Row: {
          id: string
          article_id: string
          session_id: string
          referrer: string | null
          referrer_domain: string | null
          os: string | null
          device_type: string | null
          country: string | null
          country_code: string | null
          city: string | null
          user_agent: string | null
          duration_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          session_id: string
          referrer?: string | null
          referrer_domain?: string | null
          os?: string | null
          device_type?: string | null
          country?: string | null
          country_code?: string | null
          city?: string | null
          user_agent?: string | null
          duration_seconds?: number
          created_at?: string
        }
        Update: {
          duration_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: 'page_views_article_id_fkey'
            columns: ['article_id']
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
        ]
      }
      articles: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string
          slug: string
          content: string
          date: string
          tags: string[]
          cover: string | null
          published: boolean
          product: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description?: string
          slug: string
          content?: string
          date?: string
          tags?: string[]
          cover?: string | null
          published?: boolean
          product?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          description?: string
          slug?: string
          content?: string
          date?: string
          tags?: string[]
          cover?: string | null
          published?: boolean
          product?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'articles_author_id_fkey'
            columns: ['author_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
