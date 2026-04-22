with open("src/components/hocfdc/CurriculumDetail.tsx", "r", encoding="utf-8") as f:
    text = f.read()

import re
text = re.sub(
    r'import \{ CURRICULUM_STATUS \} from "@/services/curriculum\.service";\n',
    '',
    text
)
text = text.replace(
    'import { CurriculumService } from "@/services/curriculum.service";',
    'import { CurriculumService, CURRICULUM_STATUS } from "@/services/curriculum.service";'
)

with open("src/components/hocfdc/CurriculumDetail.tsx", "w", encoding="utf-8") as f:
    f.write(text)

