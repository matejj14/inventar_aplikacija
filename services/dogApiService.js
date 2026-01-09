export async function fetchRandomDog() {
  const res = await fetch('https://dog.ceo/api/breeds/image/random');
  if (!res.ok) {
    throw new Error('Napaka pri klicu Dog API');
  }

  const json = await res.json();
  return json.message; // URL slike
}
