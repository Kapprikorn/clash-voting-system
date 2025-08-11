/**
 * Utility class for filtering operations
 */
export class FilterUtils {
  /**
   * Filters an array of items based on a search term using subsequence matching
   * @param searchTerm The search term to filter by
   * @param items Array of items to filter
   * @param nameExtractor Function to extract the name from each item (defaults to item.name)
   * @returns Filtered array of items
   */
  static filterBySubsequence<T>(
    searchTerm: string,
    items: T[],
    nameExtractor: (item: T) => string = (item: any) => item.name
  ): T[] {
    if (!searchTerm.trim()) {
      return items.slice(); // Return a copy of the original array
    }

    const filterValue = searchTerm.toLowerCase();
    return items.filter(item => {
      const itemName = nameExtractor(item).toLowerCase();
      return this.isSubsequence(filterValue, itemName);
    });
  }

  /**
   * Checks if the filter string is a subsequence of the target string
   * This allows for flexible matching where characters can be non-consecutive
   * Example: "lux" matches "Lux", "Luxanna" but also "League of Legends"
   * @param filter The filter string (search term)
   * @param target The target string to search within
   * @returns True if filter is a subsequence of target
   */
  private static isSubsequence(filter: string, target: string): boolean {
    let filterIndex = 0;
    let targetIndex = 0;

    while (filterIndex < filter.length && targetIndex < target.length) {
      if (filter[filterIndex] === target[targetIndex]) {
        filterIndex++;
      }
      targetIndex++;
    }

    // Return true if we've matched all characters in the filter
    return filterIndex === filter.length;
  }
}
