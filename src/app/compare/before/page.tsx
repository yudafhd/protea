import InvitationPlayer from "@/components/player/InvitationPlayer";
import { getTemplate } from "@/templates/registry";
export default async function BeforePage() {
  const experience = await getTemplate();
  const ids = ["opening", "couple", "schedule"];
  return <InvitationPlayer experience={{ ...experience, scenes: experience.scenes.filter((scene) => ids.includes(scene.id)), cameraPath: experience.cameraPath.filter((key) => ids.includes(key.scene)) }} comparison />;
}
