import { Html, Head, Preview, Body, Container, Section, Heading, Text, Link, Hr } from '@react-email/components'
import * as React from 'react'

interface PaymentReadyEmailProps {
    userName: string;
    leagueName: string;
    planName: string;
    checkoutUrl: string;
}

export default function PaymentReadyEmail({ userName, leagueName, planName, checkoutUrl }: PaymentReadyEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>🔓 A infraestrutura da {leagueName} está pronta!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logoText}>LIGA.ON</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>Olá, {userName}! 👋</Heading>
                        <Text style={text}>
                            Boas notícias: Nossa equipe de engenharia finalizou a configuração do seu servidor dedicado. O ambiente da <strong>{leagueName}</strong> já está isolado, seguro e pronto para receber milhares de acessos.
                        </Text>
                        <Text style={text}>
                            Para te entregar a "chave" do painel administrativo e ativar seu link exclusivo, precisamos apenas da confirmação da sua assinatura <strong>{planName}</strong>.
                        </Text>

                        <Section style={featuresContainer}>
                            <Text style={featureItem}>✅ <strong>Banco de Dados isolado</strong> (Zero interferência de outras ligas)</Text>
                            <Text style={featureItem}>✅ <strong>CDN Global</strong> (Carregamento rápido em qualquer lugar)</Text>
                            <Text style={featureItem}>✅ <strong>Painel Administrativo Pro</strong></Text>
                        </Section>

                        <Section style={buttonContainer}>
                            <Link href={checkoutUrl} style={button}>
                                Liberar Meu Acesso Agora
                            </Link>
                        </Section>

                        <Text style={subText}>
                            Assim que o pagamento for confirmado, o sistema libera seu acesso instantaneamente e você já pode começar a cadastrar os times.
                        </Text>

                        <Hr style={hr} />

                        <Text style={footerText}>
                            Estamos te esperando em campo,<br />Equipe LIGA.ON
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

const buttonContainer = {
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const button = {
    backgroundColor: '#22c55e',
    borderRadius: '8px',
    color: '#000000',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
};

const subText = {
    color: '#71717a',
    fontSize: '14px',
    lineHeight: '24px',
};

const hr = {
    borderColor: '#27272a',
    margin: '20px 0',
};

const footerText = {
    color: '#71717a',
    fontSize: '12px',
};
