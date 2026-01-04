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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcement_interactions: {
        Row: {
          announcement_id: string | null
          created_at: string
          id: string
          poll_option_id: string | null
          user_id: string | null
        }
        Insert: {
          announcement_id?: string | null
          created_at?: string
          id?: string
          poll_option_id?: string | null
          user_id?: string | null
        }
        Update: {
          announcement_id?: string | null
          created_at?: string
          id?: string
          poll_option_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_interactions_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_interactions_poll_option_id_fkey"
            columns: ["poll_option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string | null
          priority: boolean | null
          target_type: string
          target_value: string | null
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          priority?: boolean | null
          target_type: string
          target_value?: string | null
          title: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          priority?: boolean | null
          target_type?: string
          target_value?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_logs: {
        Row: {
          action: string
          amount: number
          auction_id: string | null
          created_at: string | null
          id: string
          player_id: string | null
          team_id: string | null
        }
        Insert: {
          action: string
          amount: number
          auction_id?: string | null
          created_at?: string | null
          id?: string
          player_id?: string | null
          team_id?: string | null
        }
        Update: {
          action?: string
          amount?: number
          auction_id?: string | null
          created_at?: string | null
          id?: string
          player_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_logs_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "active_auctions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_logs_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          auction_duration: number | null
          created_at: string | null
          created_by: string
          current_bid: number
          current_bidder: string | null
          current_bidder_team_name: string | null
          end_time: string | null
          id: string
          organization_id: string | null
          player_id: string
          start_price: number
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          auction_duration?: number | null
          created_at?: string | null
          created_by: string
          current_bid: number
          current_bidder?: string | null
          current_bidder_team_name?: string | null
          end_time?: string | null
          id?: string
          organization_id?: string | null
          player_id: string
          start_price: number
          start_time: string
          status: string
          updated_at?: string | null
        }
        Update: {
          auction_duration?: number | null
          created_at?: string | null
          created_by?: string
          current_bid?: number
          current_bidder?: string | null
          current_bidder_team_name?: string | null
          end_time?: string | null
          id?: string
          organization_id?: string | null
          player_id?: string
          start_price?: number
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_current_bidder_fkey"
            columns: ["current_bidder"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_transactions: {
        Row: {
          amount: number
          auction_id: string | null
          created_at: string | null
          description: string
          id: string
          is_processed: boolean | null
          organization_id: string | null
          player_name: string | null
          related_team: string | null
          team_id: string
          transfer_type: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          auction_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_processed?: boolean | null
          organization_id?: string | null
          player_name?: string | null
          related_team?: string | null
          team_id: string
          transfer_type?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          auction_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_processed?: boolean | null
          organization_id?: string | null
          player_name?: string | null
          related_team?: string | null
          team_id?: string
          transfer_type?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_transactions_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "active_auctions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          auction_id: string
          created_at: string | null
          id: string
          is_leading: boolean | null
          organization_id: string | null
          team_id: string
        }
        Insert: {
          amount: number
          auction_id: string
          created_at?: string | null
          id?: string
          is_leading?: boolean | null
          organization_id?: string | null
          team_id: string
        }
        Update: {
          amount?: number
          auction_id?: string
          created_at?: string | null
          id?: string
          is_leading?: boolean | null
          organization_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "active_auctions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      formations: {
        Row: {
          created_at: string | null
          formation_data: Json
          id: string
          is_default: boolean | null
          name: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          formation_data: Json
          id?: string
          is_default?: boolean | null
          name: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          formation_data?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      market_listings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          player_id: string
          player_name: string
          price: number
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          player_id: string
          player_name: string
          price: number
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          player_id?: string
          player_name?: string
          price?: number
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          competition: string | null
          corners_away: number | null
          corners_home: number | null
          created_at: string | null
          date: string
          divisao: string
          fouls_away: number | null
          fouls_home: number | null
          home_score: number | null
          home_team_id: string
          id: string
          match_notes: string | null
          organization_id: string | null
          possession_away: number | null
          possession_home: number | null
          round: number
          shots_away: number | null
          shots_home: number | null
          shots_on_target_away: number | null
          shots_on_target_home: number | null
          stadium: string | null
          status: string | null
          time: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          competition?: string | null
          corners_away?: number | null
          corners_home?: number | null
          created_at?: string | null
          date: string
          divisao: string
          fouls_away?: number | null
          fouls_home?: number | null
          home_score?: number | null
          home_team_id: string
          id?: string
          match_notes?: string | null
          organization_id?: string | null
          possession_away?: number | null
          possession_home?: number | null
          round: number
          shots_away?: number | null
          shots_home?: number | null
          shots_on_target_away?: number | null
          shots_on_target_home?: number | null
          stadium?: string | null
          status?: string | null
          time: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          competition?: string | null
          corners_away?: number | null
          corners_home?: number | null
          created_at?: string | null
          date?: string
          divisao?: string
          fouls_away?: number | null
          fouls_home?: number | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          match_notes?: string | null
          organization_id?: string | null
          possession_away?: number | null
          possession_home?: number | null
          round?: number
          shots_away?: number | null
          shots_home?: number | null
          shots_on_target_away?: number | null
          shots_on_target_home?: number | null
          stadium?: string | null
          status?: string | null
          time?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          chosen_plan: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_email: string | null
          owner_id: string | null
          plan: string | null
          price_id: string | null
          requested_domain: string | null
          settings: Json | null
          slug: string
          status: string | null
          theme_config: Json | null
        }
        Insert: {
          chosen_plan?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_email?: string | null
          owner_id?: string | null
          plan?: string | null
          price_id?: string | null
          requested_domain?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          theme_config?: Json | null
        }
        Update: {
          chosen_plan?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_email?: string | null
          owner_id?: string | null
          plan?: string | null
          price_id?: string | null
          requested_domain?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          theme_config?: Json | null
        }
        Relationships: []
      }
      player_favorites: {
        Row: {
          created_at: string | null
          id: string
          player_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          player_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          player_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_favorites_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          assists: number | null
          created_at: string | null
          goals: number | null
          id: string
          match_id: string | null
          organization_id: string | null
          player_id: string | null
          rating: number | null
          red_cards: number | null
          team_id: string | null
          updated_at: string | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          match_id?: string | null
          organization_id?: string | null
          player_id?: string | null
          rating?: number | null
          red_cards?: number | null
          team_id?: string | null
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          match_id?: string | null
          organization_id?: string | null
          player_id?: string | null
          rating?: number | null
          red_cards?: number | null
          team_id?: string | null
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          assistencias: number | null
          avg_rating: number | null
          cartoes_amarelos: number | null
          cartoes_vermelhos: number | null
          created_at: string | null
          gols: number | null
          id: string
          jogos: number | null
          player_id: string
          player_name: string | null
          team_id: string
          total_rating: number | null
          updated_at: string | null
        }
        Insert: {
          assistencias?: number | null
          avg_rating?: number | null
          cartoes_amarelos?: number | null
          cartoes_vermelhos?: number | null
          created_at?: string | null
          gols?: number | null
          id?: string
          jogos?: number | null
          player_id: string
          player_name?: string | null
          team_id: string
          total_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          assistencias?: number | null
          avg_rating?: number | null
          cartoes_amarelos?: number | null
          cartoes_vermelhos?: number | null
          created_at?: string | null
          gols?: number | null
          id?: string
          jogos?: number | null
          player_id?: string
          player_name?: string | null
          team_id?: string
          total_rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_transfers: {
        Row: {
          approved_by_admin: boolean | null
          approved_by_buyer: boolean | null
          approved_by_seller: boolean | null
          created_at: string | null
          exchange_players: string[] | null
          exchange_value: number | null
          from_team_id: string | null
          id: string
          is_exchange: boolean | null
          money_direction: string | null
          organization_id: string | null
          player_id: string
          player_name: string
          player_names: string[] | null
          player_values: number[] | null
          processed_by_admin: boolean | null
          status: string | null
          to_team_id: string | null
          transfer_players: string[] | null
          transfer_type: string | null
          value: number
        }
        Insert: {
          approved_by_admin?: boolean | null
          approved_by_buyer?: boolean | null
          approved_by_seller?: boolean | null
          created_at?: string | null
          exchange_players?: string[] | null
          exchange_value?: number | null
          from_team_id?: string | null
          id?: string
          is_exchange?: boolean | null
          money_direction?: string | null
          organization_id?: string | null
          player_id: string
          player_name: string
          player_names?: string[] | null
          player_values?: number[] | null
          processed_by_admin?: boolean | null
          status?: string | null
          to_team_id?: string | null
          transfer_players?: string[] | null
          transfer_type?: string | null
          value: number
        }
        Update: {
          approved_by_admin?: boolean | null
          approved_by_buyer?: boolean | null
          approved_by_seller?: boolean | null
          created_at?: string | null
          exchange_players?: string[] | null
          exchange_value?: number | null
          from_team_id?: string | null
          id?: string
          is_exchange?: boolean | null
          money_direction?: string | null
          organization_id?: string | null
          player_id?: string
          player_name?: string
          player_names?: string[] | null
          player_values?: number[] | null
          processed_by_admin?: boolean | null
          status?: string | null
          to_team_id?: string | null
          transfer_players?: string[] | null
          transfer_type?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_transfers_from_team_id_fkey"
            columns: ["from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_transfers_to_team_id_fkey"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_transfers_backup: {
        Row: {
          approved_by_admin: boolean | null
          approved_by_buyer: boolean | null
          approved_by_seller: boolean | null
          created_at: string | null
          exchange_players: string[] | null
          exchange_value: number | null
          from_team_id: string | null
          id: string | null
          is_exchange: boolean | null
          money_direction: string | null
          player_id: string | null
          player_name: string | null
          player_names: string[] | null
          player_values: number[] | null
          status: string | null
          to_team_id: string | null
          transfer_players: string[] | null
          transfer_type: string | null
          value: number | null
        }
        Insert: {
          approved_by_admin?: boolean | null
          approved_by_buyer?: boolean | null
          approved_by_seller?: boolean | null
          created_at?: string | null
          exchange_players?: string[] | null
          exchange_value?: number | null
          from_team_id?: string | null
          id?: string | null
          is_exchange?: boolean | null
          money_direction?: string | null
          player_id?: string | null
          player_name?: string | null
          player_names?: string[] | null
          player_values?: number[] | null
          status?: string | null
          to_team_id?: string | null
          transfer_players?: string[] | null
          transfer_type?: string | null
          value?: number | null
        }
        Update: {
          approved_by_admin?: boolean | null
          approved_by_buyer?: boolean | null
          approved_by_seller?: boolean | null
          created_at?: string | null
          exchange_players?: string[] | null
          exchange_value?: number | null
          from_team_id?: string | null
          id?: string | null
          is_exchange?: boolean | null
          money_direction?: string | null
          player_id?: string | null
          player_name?: string | null
          player_names?: string[] | null
          player_values?: number[] | null
          status?: string | null
          to_team_id?: string | null
          transfer_players?: string[] | null
          transfer_type?: string | null
          value?: number | null
        }
        Relationships: []
      }
      players: {
        Row: {
          acceleration: number | null
          age: number | null
          aggression: number | null
          alternative_positions: string[] | null
          average_rating: number | null
          balance: number | null
          ball_control: number | null
          ball_winning: number | null
          base_price: number | null
          club: string | null
          created_at: string | null
          curl: number | null
          defensive_awareness: number | null
          dribbling: number | null
          finishing: number | null
          form: number | null
          gk_awareness: number | null
          gk_catching: number | null
          gk_clearing: number | null
          gk_reach: number | null
          gk_reflexes: number | null
          heading: number | null
          height: number | null
          id: string
          individual_titles: string[] | null
          injury_resistance: number | null
          inspiring_ball_carry: number | null
          inspiring_lofted_pass: number | null
          inspiring_low_pass: number | null
          is_penalty_specialist: boolean | null
          jump: number | null
          kicking_power: number | null
          lofted_pass: number | null
          low_pass: number | null
          name: string
          nationality: string | null
          offensive_talent: number | null
          organization_id: string | null
          overall: number | null
          photo_url: string | null
          physical_contact: number | null
          place_kicking: number | null
          playstyle: string | null
          position: string | null
          preferred_foot: string | null
          real_club: string | null
          skills: string[] | null
          speed: number | null
          stamina: number | null
          team_id: string | null
          tight_possession: number | null
          titles: string[] | null
          total_assists: number | null
          total_goals: number | null
          total_matches: number | null
          total_red_cards: number | null
          total_yellow_cards: number | null
          value: number | null
          weak_foot_accuracy: number | null
          weak_foot_usage: number | null
        }
        Insert: {
          acceleration?: number | null
          age?: number | null
          aggression?: number | null
          alternative_positions?: string[] | null
          average_rating?: number | null
          balance?: number | null
          ball_control?: number | null
          ball_winning?: number | null
          base_price?: number | null
          club?: string | null
          created_at?: string | null
          curl?: number | null
          defensive_awareness?: number | null
          dribbling?: number | null
          finishing?: number | null
          form?: number | null
          gk_awareness?: number | null
          gk_catching?: number | null
          gk_clearing?: number | null
          gk_reach?: number | null
          gk_reflexes?: number | null
          heading?: number | null
          height?: number | null
          id?: string
          individual_titles?: string[] | null
          injury_resistance?: number | null
          inspiring_ball_carry?: number | null
          inspiring_lofted_pass?: number | null
          inspiring_low_pass?: number | null
          is_penalty_specialist?: boolean | null
          jump?: number | null
          kicking_power?: number | null
          lofted_pass?: number | null
          low_pass?: number | null
          name: string
          nationality?: string | null
          offensive_talent?: number | null
          organization_id?: string | null
          overall?: number | null
          photo_url?: string | null
          physical_contact?: number | null
          place_kicking?: number | null
          playstyle?: string | null
          position?: string | null
          preferred_foot?: string | null
          real_club?: string | null
          skills?: string[] | null
          speed?: number | null
          stamina?: number | null
          team_id?: string | null
          tight_possession?: number | null
          titles?: string[] | null
          total_assists?: number | null
          total_goals?: number | null
          total_matches?: number | null
          total_red_cards?: number | null
          total_yellow_cards?: number | null
          value?: number | null
          weak_foot_accuracy?: number | null
          weak_foot_usage?: number | null
        }
        Update: {
          acceleration?: number | null
          age?: number | null
          aggression?: number | null
          alternative_positions?: string[] | null
          average_rating?: number | null
          balance?: number | null
          ball_control?: number | null
          ball_winning?: number | null
          base_price?: number | null
          club?: string | null
          created_at?: string | null
          curl?: number | null
          defensive_awareness?: number | null
          dribbling?: number | null
          finishing?: number | null
          form?: number | null
          gk_awareness?: number | null
          gk_catching?: number | null
          gk_clearing?: number | null
          gk_reach?: number | null
          gk_reflexes?: number | null
          heading?: number | null
          height?: number | null
          id?: string
          individual_titles?: string[] | null
          injury_resistance?: number | null
          inspiring_ball_carry?: number | null
          inspiring_lofted_pass?: number | null
          inspiring_low_pass?: number | null
          is_penalty_specialist?: boolean | null
          jump?: number | null
          kicking_power?: number | null
          lofted_pass?: number | null
          low_pass?: number | null
          name?: string
          nationality?: string | null
          offensive_talent?: number | null
          organization_id?: string | null
          overall?: number | null
          photo_url?: string | null
          physical_contact?: number | null
          place_kicking?: number | null
          playstyle?: string | null
          position?: string | null
          preferred_foot?: string | null
          real_club?: string | null
          skills?: string[] | null
          speed?: number | null
          stamina?: number | null
          team_id?: string | null
          tight_possession?: number | null
          titles?: string[] | null
          total_assists?: number | null
          total_goals?: number | null
          total_matches?: number | null
          total_red_cards?: number | null
          total_yellow_cards?: number | null
          value?: number | null
          weak_foot_accuracy?: number | null
          weak_foot_usage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          announcement_id: string | null
          created_at: string
          id: string
          label: string
        }
        Insert: {
          announcement_id?: string | null
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          announcement_id?: string | null
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          player_data: Json | null
          read: boolean
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          player_data?: Json | null
          read?: boolean
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          player_data?: Json | null
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coach_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          organization_id: string
          role: string | null
          team_id: string | null
        }
        Insert: {
          coach_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          organization_id: string
          role?: string | null
          team_id?: string | null
        }
        Update: {
          coach_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string
          role?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_stats: {
        Row: {
          created_at: string | null
          derrotas: number | null
          empates: number | null
          finalizacoes: number | null
          gols_marcados: number | null
          gols_sofridos: number | null
          id: string
          jogos: number | null
          pontos: number | null
          posse_media: number | null
          saldo: number | null
          team_id: string | null
          ultimos_jogos: string[] | null
          updated_at: string | null
          vitorias: number | null
        }
        Insert: {
          created_at?: string | null
          derrotas?: number | null
          empates?: number | null
          finalizacoes?: number | null
          gols_marcados?: number | null
          gols_sofridos?: number | null
          id?: string
          jogos?: number | null
          pontos?: number | null
          posse_media?: number | null
          saldo?: number | null
          team_id?: string | null
          ultimos_jogos?: string[] | null
          updated_at?: string | null
          vitorias?: number | null
        }
        Update: {
          created_at?: string | null
          derrotas?: number | null
          empates?: number | null
          finalizacoes?: number | null
          gols_marcados?: number | null
          gols_sofridos?: number | null
          id?: string
          jogos?: number | null
          pontos?: number | null
          posse_media?: number | null
          saldo?: number | null
          team_id?: string | null
          ultimos_jogos?: string[] | null
          updated_at?: string | null
          vitorias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          balance: number | null
          coach_name: string | null
          created_at: string | null
          divisao: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string | null
        }
        Insert: {
          balance?: number | null
          coach_name?: string | null
          created_at?: string | null
          divisao?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id?: string | null
        }
        Update: {
          balance?: number | null
          coach_name?: string | null
          created_at?: string | null
          divisao?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_auctions_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_bid: number | null
          current_bidder: string | null
          current_bidder_team_logo: string | null
          current_bidder_team_name: string | null
          end_time: string | null
          id: string | null
          overall: number | null
          photo_url: string | null
          player_id: string | null
          player_name: string | null
          position: string | null
          second_highest_bid: number | null
          seconds_remaining: number | null
          start_price: number | null
          start_time: string | null
          status: string | null
          total_bids: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_current_bidder_fkey"
            columns: ["current_bidder"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_coaches: {
        Row: {
          id: string | null
          name: string | null
          role: string | null
          team_id: string | null
          team_logo: string | null
          team_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_balance_transactions: {
        Row: {
          amount: number | null
          auction_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          player_id: string | null
          player_name: string | null
          team_id: string | null
          team_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "active_auctions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_match_stats_to_teams: {
        Args: {
          p_away_score: number
          p_away_team_id: string
          p_home_score: number
          p_home_team_id: string
          p_match_id: string
        }
        Returns: undefined
      }
      cleanup_old_data: { Args: never; Returns: number }
      cleanup_old_pending_transactions: { Args: never; Returns: Json }
      create_pending_balance_transaction: {
        Args: {
          p_amount: number
          p_auction_id: string
          p_description: string
          p_team_id: string
        }
        Returns: string
      }
      decrement: {
        Args: { current_balance: number; team_id: string; x: number }
        Returns: number
      }
      ensure_single_leader: {
        Args: { p_auction_id: string; p_new_leader_id?: string }
        Returns: undefined
      }
      executar_transferencia_completa: {
        Args: {
          p_from_team_id: string
          p_player_id: string
          p_to_team_id: string
          p_transfer_id: string
          p_value: number
        }
        Returns: Json
      }
      finalize_expired_auctions_simple: { Args: never; Returns: number }
      fix_auction_transaction: { Args: { p_auction_id: string }; Returns: Json }
      get_auction_system_status: {
        Args: never
        Returns: {
          active_auctions: number
          pending_auctions: number
          pending_transactions: number
          total_bids_today: number
          total_reserved_amount: number
        }[]
      }
      get_available_balance: { Args: { p_team_id: string }; Returns: number }
      get_my_org_ids: {
        Args: never
        Returns: {
          organization_id: string
        }[]
      }
      get_poll_results: {
        Args: { announcement_id_param: string }
        Returns: {
          option_id: string
          vote_count: number
        }[]
      }
      get_server_time: { Args: never; Returns: string }
      get_team_transaction_history: {
        Args: { p_limit?: number; p_offset?: number; p_team_id: string }
        Returns: {
          amount: number
          auction_id: string
          created_at: string
          description: string
          id: string
          is_processed: boolean
          player_name: string
          type: string
        }[]
      }
      has_org_access: { Args: { org_id: string }; Returns: boolean }
      mark_transaction_processed: {
        Args: { p_transaction_id: string }
        Returns: boolean
      }
      place_bid_atomic: {
        Args: { p_amount: number; p_auction_id: string; p_team_id: string }
        Returns: Json
      }
      place_bid_atomic_fixed: {
        Args: { p_amount: number; p_auction_id: string; p_team_id: string }
        Returns: Json
      }
      process_all_expired_auctions: { Args: never; Returns: number }
      process_expired_auctions_batch: { Args: never; Returns: number }
      processar_transferencia: {
        Args: {
          p_exchange_players?: string[]
          p_from_team_id: string
          p_is_exchange?: boolean
          p_player_id: string
          p_to_team_id: string
          p_transfer_id: string
          p_transfer_players?: string[]
          p_transfer_type?: string
          p_value: number
        }
        Returns: Json
      }
      registrar_dinheiro_troca: {
        Args: {
          p_amount: number
          p_payer_name: string
          p_payer_team_id: string
          p_player_name: string
          p_receiver_name: string
          p_receiver_team_id: string
        }
        Returns: undefined
      }
      release_pending_transactions: {
        Args: { p_auction_id: string; p_except_team_id?: string }
        Returns: number
      }
      remove_match_stats_from_teams: {
        Args: {
          p_away_score: number
          p_away_team_id: string
          p_home_score: number
          p_home_team_id: string
          p_match_id: string
        }
        Returns: undefined
      }
      start_pending_auctions: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
