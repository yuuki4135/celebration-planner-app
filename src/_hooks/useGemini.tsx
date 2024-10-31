import * as React from 'react'

type Params = {
  text: string
  who: string
  when?: string
}

export const useGemini = () => {
  const [answer, setAnswer] = React.useState<any>(null)
  const [sending, setSending] = React.useState<boolean>(false)
  const [checkCelebrationError, setCheckCelebrationError] = React.useState<boolean>(false)

  const askGemini = async (text: string, who: string, when: Date) => {
    setSending(true)
    const date = when ? new Date(when).toLocaleDateString('sv-SE') : null
    const params: Params = { text: text, who: who }
    if (date) params['when'] = date
    const ex_query = new URLSearchParams(params)
    fetch('https://helloworld-cti2s6vveq-uc.a.run.app?' + ex_query, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(response => {
      return response.json()
    }).then(data => {
      console.log(data)
      setAnswer(data)
    }).catch(error => {
      console.error(error)
    }).finally(() => {
      setSending(false)
    })
  }

  const checkCelebration = async (text: string) => {
    const ex_query = new URLSearchParams({ text: text })
    fetch('https://iscelebration-cti2s6vveq-uc.a.run.app?' + ex_query, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(response => {
      return response.json()
    }).then(data => {
      if('check' in data) setCheckCelebrationError(!data.check)
    }).catch(error => {
      console.error(error)
    })
  }

  return {
    answer,
    sending,
    askGemini,
    checkCelebration,
    checkCelebrationError
  }
}
