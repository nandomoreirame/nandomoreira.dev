'use client'

import { Button } from '@/components/button'
import { Container } from '@/components/container'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/form'
import { Input } from '@/components/input'
import type { ApiResultType } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(2, { message: 'Seu nome é obrigatório' }),
  email: z.string().email({ message: 'Digite um email válido' }),
})

export function Newsletter(): JSX.Element {
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  async function onSubmit({ name, email }: z.infer<typeof formSchema>) {
    setLoading(true)

    const res = await fetch('/api/subscribe', {
      body: JSON.stringify({ name, email }),
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
    <section className="mt-12 w-full">
      <Container className="rounded-md bg-gray-300/50 py-12 text-center dark:bg-gray-900/50 md:text-left">
        <h3 className="mb-3 text-3xl font-semibold uppercase text-foreground">
          Newsletter
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-10 md:justify-between">
          <div className="w-full max-w-[430px]">
            <p className="text-lg">
              Cadastre-se para receber notificações de lançamento de novos
              produtos ou novos artigos.
            </p>
          </div>
          <div className="w-full max-w-[630px]">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col items-start gap-3 md:flex-row"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="relative pb-6">
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nome completo"
                          className="h-12"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="absolute bottom-0 left-0" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="relative pb-6">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Digite seu email"
                          className="h-12"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="absolute bottom-0 left-0" />
                    </FormItem>
                  )}
                />
                <div className="w-full md:max-w-[150px]">
                  <Button className="h-12 w-full" loading={loading}>
                    <Mail className="size-4" />
                    <span>Inscrever</span>
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </Container>
    </section>
  )
}
