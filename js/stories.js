"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // if the user is logged in, show favorite/un-favorite star
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        <div>
          ${showDeleteBtn ? getDeleteBtnHTML() : ""}
          ${showStar ? getStarHTML(story, currentUser) : ""}
          <a href="${story.url}" target="a_blank" class="story-link">
            ${story.title}
          </a>
          <small class="story-hostname">(${hostName})</small>
          <small class="story-author">by ${story.author}</small>
          <small class="story-user">posted by ${story.username}</small>
        </div>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}



/*******************************************************************************
 * Functionality for list of user's own stories
*/

function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>No stories added by user yet!</h5>");
  } else {
    // loop through all of our stories and generate HTML for them
  for (let story of currentUser.ownStories) {
    let $story = generateStoryMarkup(story, true);
    $ownStories.append($story);
  }

  $ownStories.show();
  }
}

/*******************************************************************************
 * Submitting new story form
*/

async function submitNewStory(evt) {
  console.debug("submitNewStory");
  evt.preventDefault();

  // collect form data
  const author = $("#create-author").val();
  const title = $("#create-title").val();
  const url = $("#create-url").val();
  const username = currentUser.username;
  const storyData = {author, title, url, username};

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // hide the form and reset
  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
}

$submitForm.on("submit", submitNewStory);

/*******************************************************************************
 * Functiontality to allow logged in users to favorite and un-favorite a story
*/

/** Make favorite/un-favorite star */
function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
    <span class="star">
      <i class="${starType} fa-star"></i>
    </span>`;
}

/** Put favorites list on page */

function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage");

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No Favorites Added!</h5>");
  } else {
    // loop through all of our users favorited stories and generate HTML for them
    for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}

/** Handle favorite/un-favorite a story */

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $target = $(evt.target);
  const $closestLi = $target.closest("li");
  const $storyId = $closestLi.attr("id");
  const $story = storyList.stories.find(s => s.storyId === $storyId);

  // check for story already favorited
  if ($target.hasClass("fas")) {
    
    // is a favorite. remove from user's favorite list and change star
    await currentUser.removeFavorite($story);
    $target.closest("i").toggleClass("fas far");
  }
   else {
    // currently not a favorite. toggle star
    await currentUser.addFavorite($story);
    $target.closest("i").toggleClass("fas far");
  }
}

$storiesLists.on("click", ".star", toggleStoryFavorite);


  /*******************************************************************************
 * Functiontality for logged in user to remove a story
*/

  /** Delete button HTML for story */

function getDeleteBtnHTML() {
  return `
  <span class="trash-can">
    <i class="fas fa-trash-alt"></i>
  </span>`;
}

/** Handle deleting a story */

async function deleteStory(evt) {
  console.debug("deleteStory");

  const $target = $(evt.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  // regenerate story list
  await putUserStoriesOnPage();
}

$ownStories.on("click", ".trash-can", deleteStory);