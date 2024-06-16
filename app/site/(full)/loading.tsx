import { Container } from '@/components/container'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <Container size={'sm'}>
      <div className="relative m-auto flex max-w-4xl flex-col items-center gap-12 text-center md:flex-row md:text-left">
        <div className="size-64">
          <Skeleton className="size-64 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-2 md:items-start">
          <Skeleton className="h-8 w-[88%] rounded-lg bg-slate-300 dark:bg-slate-700" />
          <Skeleton className="h-6 w-[90%] rounded-lg bg-slate-300 dark:bg-slate-700" />
          <Skeleton className="h-4 w-full rounded-lg bg-slate-300 dark:bg-slate-700" />
          <Skeleton className="h-4 w-[60%] rounded-lg bg-slate-300 dark:bg-slate-700" />
          <div className="mt-2 flex flex-col justify-center gap-4 md:mt-0 md:flex-row md:justify-start md:gap-2">
            <Skeleton className="h-10 w-full rounded-lg bg-slate-300 dark:bg-slate-700 md:w-[100px]" />
            <Skeleton className="h-10 w-full rounded-lg bg-slate-300 dark:bg-slate-700 md:w-[100px]" />
            <Skeleton className="h-10 w-full rounded-lg bg-slate-300 dark:bg-slate-700 md:w-[100px]" />
            <Skeleton className="h-10 w-full rounded-lg bg-slate-300 dark:bg-slate-700 md:w-[100px]" />
          </div>
        </div>
      </div>
    </Container>
  )
}
