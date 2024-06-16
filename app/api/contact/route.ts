import { EmailContact } from '@/components/email-contact'
import { env } from '@/env'
import { contactFormSchema, type ContactFormSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
const resend = new Resend(env.RESEND_API_KEY)

export async function POST(request: Request) {
  const formData: Partial<ContactFormSchema> = await request.json()
  const validateData = contactFormSchema.safeParse(formData)

  if (!validateData.success) {
    return NextResponse.json(
      {
        message: 'Nome, Email, Telefone, Assunto e Mensagem são obrigatórios',
        error: true,
      },
      { status: 500 },
    )
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Fernando Moreira <fer@nandomoreira.dev>',
      to: ['contato@nandomoreira.dev'],
      subject: `Novo contato: ${validateData.data.subject}`,
      text: `Novo contato: ${validateData.data.subject}`,
      react: EmailContact(validateData.data),
    })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[ email error ]', error)
    }

    if (data) {
      return NextResponse.json({
        message: 'Email enviado com sucesso, em breve entrarei em contato :)',
        error: false,
      })
    }

    return NextResponse.json(
      {
        message: 'Oops! Algo deu errado. Tente novamente mais tarde.',
        error: true,
      },
      { status: 500 },
    )
  } catch (err) {
    console.error('[ email error ]', err)
    return NextResponse.json(
      {
        message: 'Oops! Algo deu errado. Tente novamente mais tarde.',
        error: true,
      },
      { status: 500 },
    )
  }
}
