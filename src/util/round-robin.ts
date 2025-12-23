
/**
 * Round Robin algorithm to assign prospects to field reps
 * @param insideSalesReps - Array of inside sales reps
 * @param prospects - Array of prospects
 * @param processor - Function to process the batch of prospects
 * @param filler - Whether to fill in any null or undefined prospects
 * @returns Array of prospects with field rep assigned
 */
export async function roundRobin<F,P>(insideSalesReps: Array<F> = [], prospects: Array<P> = [], processor: (arg: P, selectedFieldRep: F) => Promise<P>, filler = true) {

 // Calculate the number of prospects to assign to each field rep
 const assignCountForFieldRep = Math.ceil(prospects.length / insideSalesReps.length);

 // Filter out any null or undefined prospects
 const updateProspectList = filler ? prospects.filter(item => !!item) : prospects; 

 const newList: Array<P> = [];
 let index = 0;
 let repIndex = 0;
 while (index < updateProspectList.length) {
  // Get the batch of prospects to assign to the field rep
  const limit = index + assignCountForFieldRep;
  const batch = updateProspectList.slice(index, limit);

  // Select the field rep for the batch
  const selectedFieldRep = insideSalesReps[repIndex];

  // Process the batch for assignment of field rep to prospects
  const endlisted = await Promise.all(batch.map((item, i) => processor(item, selectedFieldRep)));
  newList.push(...endlisted)

  index += assignCountForFieldRep;
  repIndex += 1
 }

 return newList;
}