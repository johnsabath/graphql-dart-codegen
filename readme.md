## Purpose

After realizing how powerful GraphQL AST traversal could be, I explored the possibility of generating boilerplate code from any GraphQL schema.  This project was inspired by [apollo-codegen](https://github.com/apollographql/apollo-codegen), which generates GraphQL client implementations for various languages.

## How does it work?

The majority of the heavy lifting comes from the [visit function](http://graphql.org/graphql-js/language/#visit) in GraphQL's official JavaScript implementation.  It provides a simple API for parsing a GraphQL schema by subscribing to enter/leave events for each type of GraphQL AST node.

The visit function also allows for an AST node to be modified when it is visited, which was the approach I used initially.  Modifying the AST nodes resulted in a [~100 LoC implementation](https://github.com/johnsabath/graphql-dart-codegen/commit/6d17719822ba08813a0093f4d41910362142bec0), as each node was reduced down to Dart syntax when visited, but it sacrificed code readability.

## Example

### Input (github.graphql)

https://gist.github.com/johnsabath/2872101c7d11b48ac4a90eedaac94960

```graphql
# The query root of GitHub's GraphQL interface.
type Query {
  # Look up a code of conduct by its key
  codeOfConduct(
    # The code of conduct's key
    key: String!
  ): CodeOfConduct

  # Look up a code of conduct by its key
  codesOfConduct: [CodeOfConduct]

  # Look up an open source license by its key
  license(
    # The license's downcased SPDX ID
    key: String!
  ): License

  # Return a list of known open source licenses
  licenses: [License]!

  # Get alphabetically sorted list of Marketplace categories
  marketplaceCategories(
    # Exclude categories with no listings.
    excludeEmpty: Boolean
  ): [MarketplaceCategory!]!

  # Look up a Marketplace category by its slug.
  marketplaceCategory(
    # The URL slug of the category.
    slug: String!
  ): MarketplaceCategory

  # Look up a single Marketplace listing
  marketplaceListing(
    # Select the listing that matches this slug. It's the short name of the listing used in its URL.
    slug: String!
  ): MarketplaceListing

  # Look up Marketplace listings
  marketplaceListings(
    # Returns the first _n_ elements from the list.
    first: Int

    # Returns the elements in the list that come after the specified global ID.
    after: String

    # Returns the last _n_ elements from the list.
    last: Int

    # Returns the elements in the list that come before the specified global ID.
    before: String

    # Select only listings with the given category.
    categorySlug: String

    # Select listings to which user has admin access. If omitted, listings visible to the
    # viewer are returned.
    #
    viewerCanAdmin: Boolean

    # Select listings that can be administered by the specified user.
    adminId: ID

    # Select listings for products owned by the specified organization.
    organizationId: ID

    # Select listings visible to the viewer even if they are not approved. If omitted or
    # false, only approved listings will be returned.
    #
    allStates: Boolean

    # Select the listings with these slugs, if they are visible to the viewer.
    slugs: [String]

    # Select only listings where the primary category matches the given category slug.
    primaryCategoryOnly: Boolean = false

    # Select only listings that offer a free trial.
    withFreeTrialsOnly: Boolean = false
  ): MarketplaceListingConnection!

  # Return information about the GitHub instance
  meta: GitHubMetadata!

  # Fetches an object given its ID.
  node(
    # ID of the object.
    id: ID!
  ): Node

  # Lookup nodes by a list of IDs.
  nodes(
    # The list of node IDs.
    ids: [ID!]!
  ): [Node]!

  # Lookup a organization by login.
  organization(
    # The organization's login.
    login: String!
  ): Organization

  # The client's rate limit information.
  rateLimit(
    # If true, calculate the cost for the query without evaluating it
    dryRun: Boolean = false
  ): RateLimit

  # Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object
  relay: Query!

  # Lookup a given repository by the owner and repository name.
  repository(
    # The login field of a user or organization
    owner: String!

    # The name of the repository
    name: String!
  ): Repository

  # Lookup a repository owner (ie. either a User or an Organization) by login.
  repositoryOwner(
    # The username to lookup the owner by.
    login: String!
  ): RepositoryOwner

  # Lookup resource by a URL.
  resource(
    # The URL.
    url: URI!
  ): UniformResourceLocatable

  # Perform a search across resources.
  search(
    # Returns the first _n_ elements from the list.
    first: Int

    # Returns the elements in the list that come after the specified global ID.
    after: String

    # Returns the last _n_ elements from the list.
    last: Int

    # Returns the elements in the list that come before the specified global ID.
    before: String

    # The search string to look for.
    query: String!

    # The types of search items to search within.
    type: SearchType!
  ): SearchResultItemConnection!

  # Look up a topic by name.
  topic(
    # The topic's name.
    name: String!
  ): Topic

  # Lookup a user by login.
  user(
    # The user's login.
    login: String!
  ): User

  # The currently authenticated user.
  viewer: User!
}
```

```graphql
# The root query for implementing GraphQL mutations.
type Mutation {
  # Applies a suggested topic to the repository.
  acceptTopicSuggestion(
    input: AcceptTopicSuggestionInput!
  ): AcceptTopicSuggestionPayload

  # Adds a comment to an Issue or Pull Request.
  addComment(input: AddCommentInput!): AddCommentPayload

  # Adds a card to a ProjectColumn. Either `contentId` or `note` must be provided but **not** both.
  addProjectCard(input: AddProjectCardInput!): AddProjectCardPayload

  # Adds a column to a Project.
  addProjectColumn(input: AddProjectColumnInput!): AddProjectColumnPayload

  # Adds a review to a Pull Request.
  addPullRequestReview(
    input: AddPullRequestReviewInput!
  ): AddPullRequestReviewPayload

  # Adds a comment to a review.
  addPullRequestReviewComment(
    input: AddPullRequestReviewCommentInput!
  ): AddPullRequestReviewCommentPayload

  # Adds a reaction to a subject.
  addReaction(input: AddReactionInput!): AddReactionPayload

  # Adds a star to a Starrable.
  addStar(input: AddStarInput!): AddStarPayload

  # Creates a new project.
  createProject(input: CreateProjectInput!): CreateProjectPayload

  # Rejects a suggested topic for the repository.
  declineTopicSuggestion(
    input: DeclineTopicSuggestionInput!
  ): DeclineTopicSuggestionPayload

  # Deletes a project.
  deleteProject(input: DeleteProjectInput!): DeleteProjectPayload

  # Deletes a project card.
  deleteProjectCard(input: DeleteProjectCardInput!): DeleteProjectCardPayload

  # Deletes a project column.
  deleteProjectColumn(
    input: DeleteProjectColumnInput!
  ): DeleteProjectColumnPayload

  # Deletes a pull request review.
  deletePullRequestReview(
    input: DeletePullRequestReviewInput!
  ): DeletePullRequestReviewPayload

  # Dismisses an approved or rejected pull request review.
  dismissPullRequestReview(
    input: DismissPullRequestReviewInput!
  ): DismissPullRequestReviewPayload

  # Lock a lockable object
  lockLockable(input: LockLockableInput!): LockLockablePayload

  # Moves a project card to another place.
  moveProjectCard(input: MoveProjectCardInput!): MoveProjectCardPayload

  # Moves a project column to another place.
  moveProjectColumn(input: MoveProjectColumnInput!): MoveProjectColumnPayload

  # Removes outside collaborator from all repositories in an organization.
  removeOutsideCollaborator(
    input: RemoveOutsideCollaboratorInput!
  ): RemoveOutsideCollaboratorPayload

  # Removes a reaction from a subject.
  removeReaction(input: RemoveReactionInput!): RemoveReactionPayload

  # Removes a star from a Starrable.
  removeStar(input: RemoveStarInput!): RemoveStarPayload

  # Set review requests on a pull request.
  requestReviews(input: RequestReviewsInput!): RequestReviewsPayload

  # Submits a pending pull request review.
  submitPullRequestReview(
    input: SubmitPullRequestReviewInput!
  ): SubmitPullRequestReviewPayload

  # Updates an existing project.
  updateProject(input: UpdateProjectInput!): UpdateProjectPayload

  # Updates an existing project card.
  updateProjectCard(input: UpdateProjectCardInput!): UpdateProjectCardPayload

  # Updates an existing project column.
  updateProjectColumn(
    input: UpdateProjectColumnInput!
  ): UpdateProjectColumnPayload

  # Updates the body of a pull request review.
  updatePullRequestReview(
    input: UpdatePullRequestReviewInput!
  ): UpdatePullRequestReviewPayload

  # Updates a pull request review comment.
  updatePullRequestReviewComment(
    input: UpdatePullRequestReviewCommentInput!
  ): UpdatePullRequestReviewCommentPayload

  # Updates viewers repository subscription state.
  updateSubscription(input: UpdateSubscriptionInput!): UpdateSubscriptionPayload

  # Replaces the repository's topics with the given topics.
  updateTopics(input: UpdateTopicsInput!): UpdateTopicsPayload
}
```

### Output (github.dart)

https://gist.github.com/johnsabath/f5507b3d5dae071808e1987f75053f49

```dart
abstract class Query {
  CodeOfConduct codeOfConduct(String key);
  List<CodeOfConduct> codesOfConduct;
  License license(String key);
  List<License> licenses;
  List<MarketplaceCategory> marketplaceCategories(bool excludeEmpty);
  MarketplaceCategory marketplaceCategory(String slug);
  MarketplaceListing marketplaceListing(String slug);
  MarketplaceListingConnection marketplaceListings(int first, String after, int last, String before, String categorySlug, bool viewerCanAdmin, String adminId, String organizationId, bool allStates, List<String> slugs, bool primaryCategoryOnly, bool withFreeTrialsOnly);
  GitHubMetadata meta;
  Node node(String id);
  List<Node> nodes(List<String> ids);
  Organization organization(String login);
  RateLimit rateLimit(bool dryRun);
  Query relay;
  Repository repository(String owner, String name);
  RepositoryOwner repositoryOwner(String login);
  UniformResourceLocatable resource(dynamic url);
  SearchResultItemConnection search(int first, String after, int last, String before, String query, SearchType type);
  Topic topic(String name);
  User user(String login);
  User viewer;
}
```

```dart
abstract class Mutation {
  AcceptTopicSuggestionPayload acceptTopicSuggestion(AcceptTopicSuggestionInput input);
  AddCommentPayload addComment(AddCommentInput input);
  AddProjectCardPayload addProjectCard(AddProjectCardInput input);
  AddProjectColumnPayload addProjectColumn(AddProjectColumnInput input);
  AddPullRequestReviewPayload addPullRequestReview(AddPullRequestReviewInput input);
  AddPullRequestReviewCommentPayload addPullRequestReviewComment(AddPullRequestReviewCommentInput input);
  AddReactionPayload addReaction(AddReactionInput input);
  AddStarPayload addStar(AddStarInput input);
  CreateProjectPayload createProject(CreateProjectInput input);
  DeclineTopicSuggestionPayload declineTopicSuggestion(DeclineTopicSuggestionInput input);
  DeleteProjectPayload deleteProject(DeleteProjectInput input);
  DeleteProjectCardPayload deleteProjectCard(DeleteProjectCardInput input);
  DeleteProjectColumnPayload deleteProjectColumn(DeleteProjectColumnInput input);
  DeletePullRequestReviewPayload deletePullRequestReview(DeletePullRequestReviewInput input);
  DismissPullRequestReviewPayload dismissPullRequestReview(DismissPullRequestReviewInput input);
  LockLockablePayload lockLockable(LockLockableInput input);
  MoveProjectCardPayload moveProjectCard(MoveProjectCardInput input);
  MoveProjectColumnPayload moveProjectColumn(MoveProjectColumnInput input);
  RemoveOutsideCollaboratorPayload removeOutsideCollaborator(RemoveOutsideCollaboratorInput input);
  RemoveReactionPayload removeReaction(RemoveReactionInput input);
  RemoveStarPayload removeStar(RemoveStarInput input);
  RequestReviewsPayload requestReviews(RequestReviewsInput input);
  SubmitPullRequestReviewPayload submitPullRequestReview(SubmitPullRequestReviewInput input);
  UpdateProjectPayload updateProject(UpdateProjectInput input);
  UpdateProjectCardPayload updateProjectCard(UpdateProjectCardInput input);
  UpdateProjectColumnPayload updateProjectColumn(UpdateProjectColumnInput input);
  UpdatePullRequestReviewPayload updatePullRequestReview(UpdatePullRequestReviewInput input);
  UpdatePullRequestReviewCommentPayload updatePullRequestReviewComment(UpdatePullRequestReviewCommentInput input);
  UpdateSubscriptionPayload updateSubscription(UpdateSubscriptionInput input);
  UpdateTopicsPayload updateTopics(UpdateTopicsInput input);
}
```
