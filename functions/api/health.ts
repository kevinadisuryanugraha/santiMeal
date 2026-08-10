export const onRequest = async () => {
  return new Response(JSON.stringify({ status: 'ok', app: 'SantriMeal AI' }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
