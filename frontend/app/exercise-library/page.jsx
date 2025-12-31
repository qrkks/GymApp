"use client";
import authStore from "@/app/store/authStore";
import Exercises from "./Exercises";
import useSWR from "swr";
import BodyPartEditPopover from "./../workouts/[date]/WorkoutSet/BodyPartEditPopover.jsx";
import RemoveButton from "./RemoveButton";
import config from "@/utils/config";

function page() {
  const {apiUrl} = config;
  const {
    data: bodyParts,
    error,
    mutate,
  } = useSWR(`${apiUrl}/body-part`, (url) =>
    fetch(url, {
      credentials: "include",
      headers: {"X-CSRFToken": authStore.getCookie("csrftoken")},
    }).then((res) => res.json())
  );

  if (error) return <div>Failed to load</div>;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h2 className="text-center">Exercise Library</h2>
      {bodyParts?.map((part) => (
        <div
          key={part.id}
          className="flex flex-col items-center justify-center "
        >
          <div className="flex items-center gap-2">
            <h3>{part.name}</h3>
            <div className="flex items-center gap-1">
              <RemoveButton part={part} mutate={mutate} />
              <BodyPartEditPopover part={part} mutateWorkout={mutate} />
            </div>
          </div>
          <Exercises part={part} mutate={mutate} />
        </div>
      ))}
    </div>
  );
}

export default page;
