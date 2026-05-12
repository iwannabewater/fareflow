export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          client_id: string;
          user_id: string;
          title: string;
          destination: string;
          base_currency: string;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          user_id: string;
          title: string;
          destination: string;
          base_currency: string;
          start_date: string;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          user_id?: string;
          title?: string;
          destination?: string;
          base_currency?: string;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          client_id: string;
          trip_id: string;
          user_id: string;
          amount: number;
          currency: string;
          base_amount: number;
          base_currency: string;
          exchange_rate: string;
          exchange_rate_at: string;
          exchange_rate_source: string;
          category: string;
          note: string | null;
          receipt_url: string | null;
          expense_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          trip_id: string;
          user_id: string;
          amount: number;
          currency: string;
          base_amount: number;
          base_currency: string;
          exchange_rate: string;
          exchange_rate_at: string;
          exchange_rate_source: string;
          category: string;
          note?: string | null;
          receipt_url?: string | null;
          expense_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          trip_id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          base_amount?: number;
          base_currency?: string;
          exchange_rate?: string;
          exchange_rate_at?: string;
          exchange_rate_source?: string;
          category?: string;
          note?: string | null;
          receipt_url?: string | null;
          expense_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

