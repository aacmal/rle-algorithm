import { getVersion as gv } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

export default function useVersion() {
  const [version, setVersion] = useState<string>("");
  useEffect(() => {
    async function getVersion() {
      const version = await gv();
      setVersion(version);
    }
    getVersion();
  }, []);

  return version;
}
