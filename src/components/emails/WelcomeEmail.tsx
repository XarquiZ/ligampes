import { Html, Head, Preview, Body, Container, Section, Img, Heading, Text, Link, Hr } from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
    userName: string;
    leagueName: string;
    plan: string;
}

export default function WelcomeEmail({ userName, leagueName, plan }: WelcomeEmailProps) {
    const isFree = plan === 'free';
    const planName = isFree ? 'Starter Grátis' : (plan === 'mensal' ? 'Pro Mensal' : 'Pro Anual');

    return (
        <Html>
            <Head />
            <Preview>O setup do seu servidor começou ⚙️</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Logo - Assuming hosted somewhere or use inline if possible, for now placeholder text/style */}
                    <Section style={header}>
                        <Heading style={logoText}>LIGA.ON</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>Olá, {userName}! 👋</Heading>
                        <Text style={text}>
                            Ótima escolha! Recebemos a solicitação de criação da <strong>{leagueName}</strong> e nosso time já iniciou o processo de configuração do seu ambiente.
                        </Text>
                        <Text style={text}>
                            Enquanto preparamos a "casa" da sua liga, veja o que te espera no plano <strong>{planName}</strong>:
                        </Text>

                        <Section style={featuresContainer}>
                            {isFree ? (
                                <>
                                    <Text style={featureItem}>✅ <strong>Qualidade 4K:</strong> Nada de imagens pixeladas. Seus cards serão profissionais.</Text>
                                    <Text style={featureItem}>✅ <strong>Zero Anúncios:</strong> Ninguém merece propaganda de xampu no meio da tabela.</Text>
                                    <Text style={featureItem}>✅ <strong>Limite de 8 Times:</strong> O tamanho perfeito para começar com qualidade.</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={featureItem}>🔥 <strong>Times Ilimitados:</strong> Cresça sua liga sem barreiras.</Text>
                                    <Text style={featureItem}>🔥 <strong>Domínio Exclusivo:</strong> Seus jogadores acessarão por um link profissional.</Text>
                                    <Text style={featureItem}>🔥 <strong>Múltiplos Campeonatos:</strong> Pontos corridos e Mata-mata simultâneos.</Text>
                                    <Text style={featureItem}>🔥 <strong>Prioridade Total:</strong> Suporte via WhatsApp e atualizações antecipadas.</Text>
                                </>
                            )}
                        </Section>

                        <Hr style={hr} />

                        <Text style={footerText}>
                            Você receberá um novo e-mail assim que seu acesso estiver liberado.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const main = {
    backgroundColor: '#09090b',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '560px',
};

const header = {
    textAlign: 'center' as const,
    padding: '20px 0',
};

const logoText = {
    color: '#22c55e',
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '-1px',
};

const content = {
    padding: '0 24px',
};

const h1 = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.25',
    marginBottom: '24px',
};

const text = {
    color: '#a1a1aa',
    fontSize: '16px',
    lineHeight: '26px',
    marginBottom: '20px',
};

const featuresContainer = {
    backgroundColor: '#18181b',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #27272a',
};

const featureItem = {
    color: '#e4e4e7',
    fontSize: '14px',
    lineHeight: '24px',
    marginBottom: '12px',
};

const hr = {
    borderColor: '#27272a',
    margin: '20px 0',
};

const footerText = {
    color: '#71717a',
    fontSize: '12px',
};
