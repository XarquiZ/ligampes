import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface PollOption {
    id: string
    label: string
}

export interface Announcement {
    id: string
    title: string
    content: string
    type: 'announcement' | 'poll'
    target_type: 'all' | 'division' | 'team'
    target_value?: string
    priority: boolean
    created_at: string
    poll_options?: PollOption[]
    read?: boolean
    voted_option_id?: string
}

export function useInbox(user: any, team: any, organizationId?: string) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const fetchAnnouncements = async () => {
        if (!user || !organizationId) return

        try {
            setLoading(true)

            // 1. Fetch all relevant announcements based on targeting
            let query = supabase
                .from('announcements')
                .select(`
          *,
          poll_options (id, label)
        `)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })

            const { data: allAnnouncements, error: annError } = await query

            if (annError) throw annError

            // 2. Fetch user interactions (reads/votes)
            const { data: interactions, error: intError } = await supabase
                .from('announcement_interactions')
                .select('*')
                .eq('user_id', user.id)

            if (intError) throw intError

            // 3. Filter and Map
            const relevantAnnouncements = allAnnouncements.filter(ann => {
                if (ann.target_type === 'all') return true
                if (ann.target_type === 'division' && team?.divisao === ann.target_value) return true
                if (ann.target_type === 'team' && team?.id === ann.target_value) return true
                return false
            }).map(ann => {
                const interaction = interactions.find(i => i.announcement_id === ann.id)
                return {
                    ...ann,
                    read: !!interaction,
                    voted_option_id: interaction?.poll_option_id
                }
            })

            setAnnouncements(relevantAnnouncements)
            setUnreadCount(relevantAnnouncements.filter(a => !a.read).length)

        } catch (error) {
            console.error('Error fetching inbox:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (announcementId: string) => {
        // Optimistic Update
        const previousAnnouncements = [...announcements]
        const previousUnread = unreadCount

        setAnnouncements(prev => prev.map(a =>
            a.id === announcementId ? { ...a, read: true } : a
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))

        try {
            const { error } = await supabase
                .from('announcement_interactions')
                .insert({
                    user_id: user.id,
                    announcement_id: announcementId
                })

            if (error) throw error

        } catch (error) {
            console.error('Error marking as read:', error)
            // Rollback
            setAnnouncements(previousAnnouncements)
            setUnreadCount(previousUnread)
        }
    }

    const votePoll = async (announcementId: string, optionId: string) => {
        // Optimistic Update
        const previousAnnouncements = [...announcements]
        const previousUnread = unreadCount

        setAnnouncements(prev => prev.map(a =>
            a.id === announcementId ? { ...a, read: true, voted_option_id: optionId } : a
        ))

        const wasRead = announcements.find(a => a.id === announcementId)?.read
        if (!wasRead) {
            setUnreadCount(prev => Math.max(0, prev - 1))
        }

        try {
            const { error } = await supabase
                .from('announcement_interactions')
                .upsert({
                    user_id: user.id,
                    announcement_id: announcementId,
                    poll_option_id: optionId
                })

            if (error) throw error

        } catch (error) {
            console.error('Error voting:', error)
            // Rollback
            setAnnouncements(previousAnnouncements)
            setUnreadCount(previousUnread)
        }
    }

    // Realtime subscription
    useEffect(() => {
        if (!user) return

        fetchAnnouncements()

        const channel = supabase
            .channel('public:announcements')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
                fetchAnnouncements()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.id, team?.id, organizationId])

    return {
        announcements,
        unreadCount,
        loading,
        markAsRead,
        votePoll,
        refresh: fetchAnnouncements
    }
}
