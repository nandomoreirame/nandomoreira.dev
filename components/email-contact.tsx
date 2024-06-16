import type { ContactFormSchema } from '@/lib/validations'
import tailwindConfig from '@/tailwind.config'
import { Body, Head, Section, Tailwind, Text } from '@react-email/components'
import * as React from 'react'

interface EmailContactProps extends ContactFormSchema {}

export const EmailContact: React.FC<Readonly<EmailContactProps>> = ({
  name,
  email,
  message,
  phone,
  subject,
  website,
}) => (
  <Tailwind config={tailwindConfig}>
    <Head />
    <Body>
      <Section className="m-auto max-w-[500px] py-6">
        <Section className="m-auto rounded-lg bg-gray-200 p-6 font-[sans-serif] text-black">
          <Section>
            <Section className="mb-4">
              <Text className="m-0 text-[22px] font-bold leading-[24px] text-black">
                {subject}
              </Text>
            </Section>
            <Text className="m-0 text-[16px] leading-[24px] text-black">
              <Text className="m-0 text-lg font-bold text-black">Nome:</Text>
              <Text className="m-0 text-base font-normal text-gray-800">
                {name}
              </Text>
            </Text>
            <Text className="m-0 text-[16px] leading-[24px] text-black">
              <Text className="m-0 text-lg font-bold text-black">Email:</Text>
              <Text className="m-0 text-base font-normal text-gray-800">
                {email}
              </Text>
            </Text>
            <Text className="m-0 text-[16px] leading-[24px] text-black">
              <Text className="m-0 text-lg font-bold text-black">
                Telefone:
              </Text>
              <Text className="m-0 text-base font-normal text-gray-800">
                {phone}
              </Text>
            </Text>
            {website && (
              <Text className="m-0 text-[16px] leading-[24px] text-black">
                <Text className="m-0 text-lg font-bold text-black">
                  Website:
                </Text>
                <Text className="m-0 text-base font-normal text-gray-800">
                  {website}
                </Text>
              </Text>
            )}
            <Text className="m-0 text-[16px] leading-[24px] text-black">
              <Text className="m-0 text-lg font-bold text-black">
                Mensagem:
              </Text>
              <Text className="m-0 text-base font-normal text-gray-800">
                {message}
              </Text>
            </Text>
          </Section>
        </Section>
      </Section>
    </Body>
  </Tailwind>
)
