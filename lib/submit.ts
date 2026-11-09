import { startTransition } from 'react'

/**
 * Submit a form to a useActionState action without React's automatic form reset.
 * React 19 resets a <form action={…}> after each submission, which puts controlled
 * <select>/radio/checkbox fields out of sync with state (e.g. "Save anyway" would
 * send the wrong category). Submitting manually keeps what the user sees = what is sent.
 * The clicked button's name/value (e.g. confirmDuplicate=1) is included.
 */
export function submitWithoutReset(dispatch: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null
    const fd = new FormData(e.currentTarget, submitter)
    startTransition(() => dispatch(fd))
  }
}
