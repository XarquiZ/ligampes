// src/app/page.tsx → 100% correto
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login') // ← sempre pro login
}