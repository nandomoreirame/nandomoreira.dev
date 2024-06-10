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
      <Container className="bg-gray-300/50 py-12 text-center dark:bg-gray-900/50 md:rounded-md md:text-left">
        <h3 className="mb-3 text-3xl font-semibold uppercase text-foreground">
          Newsletter
        </h3>
        <div className="md:grid-auto-columns-1/2 grid gap-10 md:grid-cols-2">
          <div className="w-full">
            <p className="text-lg">
              Cadastre-se para receber notificações de lançamento de novos
              produtos ou novos artigos.
            </p>
          </div>
          <div className="w-full">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col items-start gap-3 md:flex-row"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="relative w-full pb-6">
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
                    <FormItem className="relative w-full pb-6">
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
