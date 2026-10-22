export function missingMessagingSchema(error: { code?: string; message?: string } | null | undefined): boolean {
  return Boolean(error && (
    ['42P01', '42883', 'PGRST200', 'PGRST202', 'PGRST205'].includes(error.code ?? '') ||
    /relation .* does not exist|schema cache.*(conversation|message)|could not find the .*(table|function)/i.test(error.message ?? '')
  ))
}
