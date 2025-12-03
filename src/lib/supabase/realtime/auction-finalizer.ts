import { supabase } from '@/lib/supabase'

export class AuctionFinalizer {
  private static instance: AuctionFinalizer
  private processingSet: Set<string> = new Set()

  static getInstance(): AuctionFinalizer {
    if (!AuctionFinalizer.instance) {
      AuctionFinalizer.instance = new AuctionFinalizer()
    }
    return AuctionFinalizer.instance
  }

  async finalizeAuction(auctionId: string): Promise<any> {
    if (this.processingSet.has(auctionId)) {
      console.log(`⏳ Leilão ${auctionId} já está sendo finalizado`)
      return { alreadyProcessed: true }
    }

    this.processingSet.add(auctionId)
    
    try {
      console.log(`🔄 FINALIZANDO LEILÃO: ${auctionId}`)
      
      const { data: auctionData, error: updateError } = await supabase
        .from('auctions')
        .update({ 
          status: 'finished',
          updated_at: new Date().toISOString()
        })
        .eq('id', auctionId)
        .select('current_bid, current_bidder')
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar status do leilão:', updateError)
        throw new Error(`Falha ao finalizar leilão: ${updateError.message}`)
      }

      console.log('✅ Status do leilão atualizado para finished')

      const result = {
        success: true,
        auctionId,
        final_amount: auctionData?.current_bid || 0,
        winner_team_id: auctionData?.current_bidder || null,
        message: 'Leilão finalizado com sucesso'
      }
      
      return result

    } catch (error: any) {
      console.error('❌ Erro na finalização do leilão:', error)
      return {
        success: false,
        error: error.message || 'Erro desconhecido na finalização'
      }
    } finally {
      setTimeout(() => {
        this.processingSet.delete(auctionId)
      }, 5000)
    }
  }

  // 🔥 NOVA FUNÇÃO: Obtém tempo restante sincronizado
  async getSynchronizedRemainingTime(auctionId: string): Promise<number> {
    try {
      // 1. Obtém tempo do servidor
      const { data: serverTime, error: timeError } = await supabase.rpc('get_server_time')
      
      if (timeError) {
        console.warn('⚠️ Fallback: usando tempo local (erro ao obter tempo do servidor):', timeError)
        return this.getLocalRemainingTime(auctionId)
      }

      // 2. Busca o end_time do leilão
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('end_time, status')
        .eq('id', auctionId)
        .single()
      
      if (auctionError || !auction) {
        console.warn('⚠️ Leilão não encontrado:', auctionError)
        return 0
      }

      if (auction.status !== 'active' || !auction.end_time) {
        return 0
      }

      // 3. Calcula tempo restante usando tempo do servidor
      const endTime = new Date(auction.end_time).getTime()
      const serverNow = new Date(serverTime).getTime()
      const remaining = Math.max(0, endTime - serverNow)
      
      console.log(`⏰ Tempo sincronizado ${auctionId}: ${remaining}ms (servidor: ${serverTime})`)
      return remaining
      
    } catch (error) {
      console.error('❌ Erro ao calcular tempo sincronizado:', error)
      return this.getLocalRemainingTime(auctionId)
    }
  }

  // Função fallback: tempo local
  private async getLocalRemainingTime(auctionId: string): Promise<number> {
    const { data: auction } = await supabase
      .from('auctions')
      .select('end_time, status')
      .eq('id', auctionId)
      .single()
      
    if (!auction || auction.status !== 'active' || !auction.end_time) return 0
    
    const endTime = new Date(auction.end_time).getTime()
    const now = Date.now()
    return Math.max(0, endTime - now)
  }

  // 🔥 NOVA FUNÇÃO: Verifica e finaliza leilões expirados
  async checkAndFinalizeExpiredAuctions(): Promise<void> {
    try {
      console.log('⏰ Verificando leilões expirados...')
      
      const { data: expiredAuctions, error } = await supabase
        .from('auctions')
        .select('id, end_time')
        .eq('status', 'active')
        .lt('end_time', new Date().toISOString())
        .limit(10)

      if (error) {
        console.error('❌ Erro ao buscar leilões expirados:', error)
        return
      }

      if (expiredAuctions && expiredAuctions.length > 0) {
        console.log(`⏰ ${expiredAuctions.length} leilão(es) expirado(s) encontrado(s)`)
        
        for (const auction of expiredAuctions) {
          console.log(`🔁 Finalizando leilão expirado: ${auction.id}`)
          await this.finalizeAuction(auction.id)
          await new Promise(resolve => setTimeout(resolve, 1000)) // Delay entre processamentos
        }
      }
    } catch (error) {
      console.error('❌ Erro na verificação de leilões expirados:', error)
    }
  }
}

export const auctionFinalizer = AuctionFinalizer.getInstance()