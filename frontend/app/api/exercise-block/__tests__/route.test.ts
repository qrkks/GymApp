import { NextRequest } from "next/server";
import { POST } from "../route";
import { requireAuth } from "@/lib/auth-helpers";
import * as workoutUseCase from "@domain/workout/application/workout.use-case";

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@domain/workout/application/workout.use-case", () => ({
  createExerciseBlock: jest.fn(),
}));

describe("POST /api/exercise-block", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({ id: "offline-user" });
    (workoutUseCase.createExerciseBlock as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        created: false,
        exercise: { id: 2, name: "Bench Press" },
        sets: [],
      },
    });
  });

  it("normalizes the offline client mutation id before calling the use case", async () => {
    const clientMutationId = "f839b9d8-90b8-4232-bfa8-788b074d3528";
    const request = new NextRequest("http://localhost/api/exercise-block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workout_date: "2026-08-18",
        exercise_name: "Bench Press",
        sets: [
          {
            weight: 60,
            reps: 8,
            note: "offline",
            client_mutation_id: clientMutationId,
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(workoutUseCase.createExerciseBlock).toHaveBeenCalledWith(
      "offline-user",
      "2026-08-18",
      "Bench Press",
      [
        {
          weight: 60,
          reps: 8,
          note: "offline",
          clientMutationId,
        },
      ]
    );
  });
});
