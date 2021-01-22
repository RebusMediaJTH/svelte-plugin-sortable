# svelte-plugin-sortable

Allows the arrangement of items in one or more containers via dragdrop (mouse and touch), keyboard and tap (for mobile AT).

If more than one container, it can be specified whether the items should be in a specific order or not.

## Accessible Technology Implementations

### keyboard

For keyboard users with or without a screenreader.

-   SPACE = Pick up/drop an item
-   LEFT/UP = Nagivate to previous item
-   RIGHT/DOWN = Nagivate to next item
-   Alt + LEFT/UP = Move item up/left
-   Alt + RIGHT/DOWN = Move item right/down
-   Ctrl + LEFT/UP = Move item to previous box
-   Ctrl + RIGHT/DOWN = Move item to next box

Hidden text, readable by screen readers and visible to all when tabbed into, is appended before the containers and instructs: "For keyboard users, use the arrow keys to navigate the items. Press the alt key with an arrow key to move an item. Press the control key with an arrow key to move an item between boxes.". _Note: the last sentence is omitted if there is only one container._

After an item has been moved:

-   If the option _showHints_ is set, screenreader only text "Correct!" | "Incorrect" is revealed in the item.
-   If the option _showHints_ is set, a live region announces: "x of y items are correctly placed" | "All items are correctly placed!"

### Click/Tap

For mobile screenreader users.

-   All items start with [aria-selected="false"].
-   When an item is selected:
    -   [aria-selected] is set
    -   for all other items, in the same container & before the selected item, the following screenreader text is revealed: "Activate to place the selected item before this."
    -   for all other items, in the same container & after the selected item, the following screenreader text is revealed: "Activate to place the selected item after this."
    -   for all other items in other containers, the following screenreader text is revealed: "Activate to place the selected item before this."
    -   a placeholder is added to all other containers with the following screenreader text: "End of the list. Activate to place the selected item here."
-   If the selected item is tapped again, all of the above changes are reset.
-   If another item is tapped:
    -   The item is moved before or after it and all of the above changes are reset.
    -   If the option _showHints_ is set, screenreader only text "Correct!" | "Incorrect" is revealed in the item.
    -   If the option _showHints_ is set, a live region announces: "x of y items are correctly placed" | "All items are correctly placed!"

_Note: it is not possible to determine whether AT software is in use or not. For this reason, the tap functionality must always be available. This means that a mouse user or non-AT using mobile user can perform the task either via dragdrop of tap._

## AT Helpers

A component *LiveFeedback.svelte* is used to announce live feedback to AT users and provides a couple of advantages over a vanilla *[aria-live]* element:
-   The content, by default, is cleared after 5 seconds. This avoids the confusion of an AT user navigating into stale content.
-   If the content to be announced is the same as the content that was last announced, it is first cleared and then set again to ensure that it is announced.

## Editor Mode

The task can be initialised in editor mode that allows the addition/deletion of containers and items.

-   A toggle button specifies whether the items are being arranged for the initial or correct position.
-   An "Enable Item Edit" button allows the deletion of an item and the editing of its label. The reason it's not always enabled is so that keyboard users can disable it to reduce the number of tab stops when moving items.

### TO DO

-   Allow the Ordered, Delete container & Add item buttons to be hidden to reduce the number of tab stops for keyboard users when moving items.
-   Move the *ordered* option from a per container basis to a global option.
-   The container delete button is disabled unless the container is empty in the current context (initial or correct). If it's clicked and items still exist in the other context, a message is shown that says that items still exist in that context. At the moment, it's shown via an alert. It needs replacing with a suitable alert/modal component.

## CDPMock

I've modified CDPMock.js to allow the state to be persisted via local or session storage between browser refreshes.
Set the constant *persistState* to *local* | *session* | *false*