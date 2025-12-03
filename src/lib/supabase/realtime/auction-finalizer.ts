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
}

export const auctionFinalizer = AuctionFinalizer.getInstance()