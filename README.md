# geog464-lab5-project
lab 5 and project
# GEOG464 Lab 5

**Live interactive map:** [Open my map](https://gianniscaramuzzi.github.io/geog464-lab5-project/A2_Scaramuzzi/site/)

## Lab 6 - A3 feature: Greenspace distance filter

For A3 I will add an interactive distance filter,
so that my reader can explore which building roof
outlines are located closest to mapped greenspaces.

It has depth because it responds to user input
and filters the displayed roof outlines based on
their distance from greenspace.

I will know it works when changing the distance
slider updates the visible roof outlines and the
number of matching outlines.

My edge case is when no roof outlines fall within
the selected distance.

# Tests

Test 1. I set the maximum distance to 100 m.
Expected: Only roof outlines within 100 m of
greenspace are displayed, and the count updates.

Test 2. I increase the maximum distance to 500 m.
Expected: More matching roof outlines appear
and the count updates accordingly.

Test 3. I set the maximum distance to 0 m.
Expected: Only outlines at 0 m are displayed.
If none match, a clear no-results message appears.