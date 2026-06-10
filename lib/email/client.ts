import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.EMAIL_FROM!,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error('[Email Error]', error)
      return { success: false, error: error.message }
    }

    console.log('[Email Sent]', { id: data?.id, to, subject })
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email Error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    }
  }
}