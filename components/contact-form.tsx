'use client'

import { Button } from '@/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/form'
import { Input } from '@/components/input'
import { Label } from '@/components/label'
import { Textarea } from '@/components/textarea'
import { useBoolean } from '@/hooks/useBoolean'
import { contactFormSchema, type ContactFormSchema } from '@/lib/validations'
import type { ApiResultType } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

const defaultValues = {
  name: '',
  email: '',
  phone: '',
  website: '',
  subject: '',
  message: '',
}

export function ContactForm(): JSX.Element {
  const { value: loading, setValue: setLoading } = useBoolean(false)
  const form = useForm<ContactFormSchema>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  })

  async function onSubmit(data: ContactFormSchema) {
    setLoading(true)

    const res = await fetch('/api/contact', {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const result = (await res.json()) as ApiResultType

    if (result.error) {
      console.error('[ error ]', result.message)
      toast.error(result.message)
    } else {
      toast.success(result.message)
    }

    setLoading(false)
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <Label htmlFor="contact-name">Nome</Label>
                <FormControl>
                  <Input
                    type="text"
                    id="contact-name"
                    placeholder="Seu nome completo"
                    className="h-12"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <Label htmlFor="contact-email">Email</Label>
                <FormControl>
                  <Input
                    type="email"
                    id="contact-email"
                    placeholder="Digite seu melhor email"
                    className="h-12"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="w-full">
                <Label htmlFor="contact-phone">Telefone</Label>
                <FormControl>
                  <Input
                    type="text"
                    id="contact-phone"
                    placeholder="Digite seu telefone"
                    className="h-12"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem className="w-full">
                <Label htmlFor="contact-website">Endereço do Site</Label>
                <FormControl>
                  <Input
                    type="text"
                    id="contact-website"
                    placeholder="Cole o URL do seu site aqui"
                    className="h-12"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem className="w-full">
              <Label htmlFor="contact-subject">Assunto</Label>
              <FormControl>
                <Input
                  type="text"
                  id="contact-subject"
                  placeholder="Qual assunto quer tratar?"
                  className="h-12"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="w-full">
              <Label htmlFor="contact-message">Mensagem</Label>
              <FormControl>
                <Textarea
                  id="contact-message"
                  placeholder="Digite sua message aqui"
                  className="h-12"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="w-full md:flex md:justify-end">
          <Button
            className="h-12 w-full uppercase md:max-w-40"
            loading={loading}
          >
            {loading && <>Enviando...</>}
            {!loading && <>Enviar</>}
          </Button>
        </div>
      </form>
    </Form>
  )
}
