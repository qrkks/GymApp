"use client";
import useSWR from "swr";
import config from "@/utils/config";

export default function Home() {
  const {apiUrl} = config;
  const {data, error} = useSWR(`${apiUrl}`, (url) =>
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
