import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Seu nome é obrigatório' }),
  email: z.string().email({ message: 'Digite um email válido' }),
  phone: z.string().min(11, { message: 'O telefone é obrigatório' }),
  website: z.string().optional(),
  subject: z.string().min(4, { message: 'O assunto é obrigatório' }),
  message: z.string().min(6, { message: 'Mensagem muito curta' }),
})

export type ContactFormSchema = z.infer<typeof contactFormSchema>
