const SIMULATED_DELAY_MS = 3000;

function isTestRuntime() {
  return import.meta.env.MODE === "test" || Boolean(import.meta.env.VITEST);
}

export async function waitForSimulatedDelay() {
  if (isTestRuntime()) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, SIMULATED_DELAY_MS);
  });
}
