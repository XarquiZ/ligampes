import { Html, Head, Preview, Body, Container, Section, Heading, Text, Link, Hr } from '@react-email/components'
import * as React from 'react'

interface LeagueActiveEmailProps {
    userName: string;
    leagueName: string;
    leagueUrl: string;
    loginUrl: string;
}

export default function LeagueActiveEmail({ userName, leagueName, leagueUrl, loginUrl }: LeagueActiveEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>⚽ Apito Inicial! A {leagueName} está no ar.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logoText}>LIGA.ON</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>Olá, {userName}! 👋</Heading>
                        <Text style={text}>
                            A espera acabou. O ambiente da sua liga foi configurado com sucesso e já está disponível para o mundo.
                        </Text>
                        <Text style={text}>
                            Você já pode acessar seu Painel Administrativo, criar os times e gerar a tabela do campeonato.
                        </Text>

                        <Section style={linkContainer}>
                            <Text style={text}>🔗 <strong>Seu Link Oficial:</strong></Text>
                            <Link href={leagueUrl} style={link}>
                                {leagueUrl}
                            </Link>
                        </Section>

                        <Section style={buttonContainer}>
                            <Link href={loginUrl} style={button}>
                                Acessar Painel do Organizador
                            </Link>
                        </Section>

                        <Text style={text}>
                            <strong>Por onde começar?</strong>
                        </Text>
                        <Text style={listItem}>1. Cadastre os escudos dos times.</Text>
                        <Text style={listItem}>2. Crie sua primeira temporada.</Text>
                        <Text style={listItem}>3. Compartilhe o link com a galera.</Text>

                        <Hr style={hr} />

                        <Text style={footerText}>
                            Bom jogo!<br />Equipe LIGA.ON
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

const linkContainer = {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#18181b',
    borderRadius: '8px',
    border: '1px solid #27272a',
};

const link = {
    color: '#22c55e',
    fontSize: '16px',
    textDecoration: 'underline',
};

const listItem = {
    color: '#e4e4e7',
    fontSize: '15px',
    lineHeight: '24px',
    marginBottom: '8px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    marginBottom: '32px',
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

const hr = {
    borderColor: '#27272a',
    margin: '20px 0',
};

const footerText = {
    color: '#71717a',
    fontSize: '12px',
};
