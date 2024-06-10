import tailwindConfig from '@/tailwind.config'
import { Body, Head, Section, Tailwind, Text } from '@react-email/components'
import * as React from 'react'

interface EmailNewsletterProps {
  name: string
  email: string
}

export const EmailNewsletter: React.FC<Readonly<EmailNewsletterProps>> = ({
  name,
  email,
}) => (
  <Tailwind config={tailwindConfig}>
    <Head />
    <Body>
      <Section className="m-auto max-w-[500px] py-6">
        <Section className="m-auto rounded-lg bg-gray-200 p-6 font-[sans-serif] text-black">
          <Section>
            <Section className="mb-4">
              <Text className="m-0 text-[22px] font-bold leading-[24px] text-black">
                Novo email cadastrado no site
              </Text>
            </Section>
            <Text className="m-0 mb-1 text-[16px] leading-[24px] text-black">
              <Text className="font-bold text-black">Nome:</Text> {name}
            </Text>
            <Text className="m-0 mb-1 text-[16px] leading-[24px] text-black">
              <Text className="font-bold text-black">Email:</Text> {email}
            </Text>
          </Section>
        </Section>
      </Section>
    </Body>
  </Tailwind>
)
