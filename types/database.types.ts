// Types générés manuellement depuis le schéma supabase/schema.sql
// Régénérer avec : npx supabase gen types typescript --project-id <ID> > types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: string
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string
          role?: string
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          role?: string
          avatar_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
