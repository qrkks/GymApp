"use client";
import useSWR from "swr";

export default function Home() {
  const {data, error} = useSWR("http://127.0.0.1:8000/api", (url) =>
    fetch(url, {
      method: "GET",
      credentials: "include",
    }).then((res) => res.json())
  );
  return (
    <div>
      <p>Hello World</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
