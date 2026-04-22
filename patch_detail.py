with open("src/components/hocfdc/CurriculumDetail.tsx", "r", encoding="utf-8") as f:
    text = f.read()

import re

text = text.replace(
'''import { useSyllabusWorkspace } from "@/hooks/useSyllabusWorkspace";''',
'''import { useQuery } from "@tanstack/react-query";
import { CurriculumService } from "@/services/curriculum.service";'''
)

text = re.sub(
    r'const \{ curriculum, isLoading \} = useSyllabusWorkspace\(id\);',
    '''const { data, isLoading } = useQuery({
    queryKey: ["curriculum-details", id],
    queryFn: () => CurriculumService.getCurriculumById(id),
  });
  const curriculum = data?.data;''',
    text
)

with open("src/components/hocfdc/CurriculumDetail.tsx", "w", encoding="utf-8") as f:
    f.write(text)

