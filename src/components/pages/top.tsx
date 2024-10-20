import * as React from 'react'

export const Top = () => {

  React.useEffect(() => {
    fetch('https://helloworld-cti2s6vveq-uc.a.run.app/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      console.log(response)
    })
  }, [])

  return (
    <div>
      <h1>Top Page</h1>
    </div>
  )
}
