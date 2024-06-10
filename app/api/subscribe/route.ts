import { EmailNewsletter } from '@/components/email-newsletter'
import { env } from '@/env'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
const resend = new Resend(env.RESEND_API_KEY)

interface RequestData {
  email: string
  name: string
}

export async function POST(request: Request) {
  const { email, name }: Partial<RequestData> = await request.json()

  if (!email || !name) {
    const message = 'O nome e email são obrigatórios'
    return NextResponse.json({ message, error: true }, { status: 500 })
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Fernando Moreira <fer@nandomoreira.dev>',
      to: ['contato@nandomoreira.dev'],
      subject: 'Novo email cadastrado no site',
      text: `Novo email cadastrado no site: Nome: ${name} - Email: ${email}`,
      react: EmailNewsletter({ name, email }),
    })

    if (error) {
      console.error('[ error ]', error)
      return NextResponse.json(
        {
          message: 'Oops! Algo deu errado. Tente novamente mais tarde.',
          error: true,
        },
        { status: 500 },
      )
    }

    const fullName = name.split(/(\s).+\s/).join('')
    let firstName = fullName.split(' ').slice(-1).join(' ')
    let lastName = ''

    const fullNameSplit = name.split(' ')
    if (fullNameSplit.length > 1) {
      firstName = fullName.split(' ').slice(0, -1).join(' ')
      lastName = fullName.split(' ').slice(-1).join(' ')
    }

    resend.contacts.create({
      email,
      firstName,
      lastName,
      unsubscribed: false,
      audienceId: env.RESEND_AUDIENCE_ID,
    })

    console.log('[ data ]', data)

    return NextResponse.json({
      message: 'Email cadastrado com sucesso',
      error: false,
    })
  } catch (err) {
    console.error('[ error ]', err)
    return NextResponse.json(
      {
        message: 'Oops! Algo deu errado. Tente novamente mais tarde.',
        error: true,
      },
      { status: 500 },
    )
  }
}
