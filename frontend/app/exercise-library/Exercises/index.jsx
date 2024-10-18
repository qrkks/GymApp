import { useState, useEffect } from "react"
import authStore from "@/app/store/authStore";
import RemoveButton from "./RemoveButton";
import useSWR from "swr";
import EditPopover from "./EditPopover";

function index({part}) {

    const {data: exercises, error, mutate} = useSWR(
        `http://127.0.0.1:8000/api/exercise?body_part_name=${part.name}`,
        (url) =>
            fetch(url, {
                credentials: "include",
                headers: {"X-CSRFToken": authStore.getCookie("csrftoken")},
            }).then((res) => res.json())
    );

    if (error) return <div>Failed to load</div>;

    return (
        <ul className="flex flex-col items-center gap-2">
            {exercises?.map((exercise) => (
                <li key={exercise.id} className="flex items-center gap-2">
                    <p>{exercise.name}</p>
                    <div className="flex items-center gap-1">
                    <RemoveButton exercise={exercise} mutate={mutate} />
                    <EditPopover exercise={exercise} mutate={mutate} />
                    </div>
                </li>
            ))}

        </ul>
    )
}

export default index
