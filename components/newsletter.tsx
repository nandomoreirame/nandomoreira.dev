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
import { useBoolean } from '@/hooks/useBoolean'
import type { ApiResultType } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(2, { message: 'Seu nome é obrigatório' }),
  email: z.string().email({ message: 'Digite um email válido' }),
})

export function Newsletter(): JSX.Element {
  const { value: loading, setValue: setLoading } = useBoolean(false)
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
    <section className="mt-12 w-full animate-fade-in-up pb-12 animate-delay-800 animate-duration-slow">
      <Container className="relative bg-gray-300/50 py-12 text-center dark:bg-gray-900/50 md:rounded-md md:text-left">
        <div
          aria-hidden="true"
          className="absolute inset-0 z-1 -mt-72 sm:-mt-32 md:mt-0"
        >
          <svg
            className="absolute inset-0 size-full"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 1463 360"
          >
            <path
              className="text-gray-500 text-opacity-10"
              fill="currentcolor"
              d="M-82.673 72l1761.849 472.086-134.327 501.315-1761.85-472.086z"
            />
            <path
              className="text-gray-500 text-opacity-10"
              fill="currentcolor"
              d="M-217.088 544.086 1544.761 72l134.327 501.316-1761.849 472.086z"
            />
          </svg>
        </div>

        <h3 className="relative z-5 mb-3 text-3xl font-semibold uppercase text-foreground">
          Newsletter
        </h3>
        <div className="md:grid-auto-columns-1/2 relative z-5 grid gap-10 md:grid-cols-2">
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
