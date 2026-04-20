/* server/get-addons.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";
import { ADMIN_BASE_PATH, CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import sql from "@/config/database/db";



  async function TestData(){
   var categories= await sql`
      SELECT 
    c.id AS "Id",
    common.get_translation_t(c.name_translations, 'en', 'en') AS "Label",
    COUNT(sd.id) AS "Count"
FROM category.categories c
LEFT JOIN category.service_definitions sd 
    ON sd.category_id = c.id
GROUP BY 
    c.id,
    common.get_translation_t(c.name_translations, 'en', 'en')
ORDER BY COUNT(sd.id) DESC;
    `
    return categories;
  }

  

export const getPopularSearches = async (
)=> {
  "use cache"
  cacheTag("get-popular-searches");
  cacheLife("default");

   const popularSearches= await sql`
WITH recent AS (
    SELECT normalized_term, COUNT(*) AS cnt
    FROM search.user_search_history
    WHERE created_at >= now() - interval '7 days'
    GROUP BY normalized_term
),
previous AS (
    SELECT normalized_term, COUNT(*) AS cnt
    FROM search.user_search_history
    WHERE created_at >= now() - interval '14 days'
      AND created_at < now() - interval '7 days'
    GROUP BY normalized_term
)
SELECT 
    r.normalized_term AS "Query",
    CONCAT(
        '+',
        ROUND(
            ((r.cnt - COALESCE(p.cnt,0)) * 100.0) / GREATEST(COALESCE(p.cnt,1),1),
            0
        ),
        '%'
    ) AS "Trend"
FROM recent r
LEFT JOIN previous p 
    ON p.normalized_term = r.normalized_term
ORDER BY r.cnt DESC
LIMIT 6;`
   
 
  return popularSearches;
};
