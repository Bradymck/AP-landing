## Rules
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

#### Frontend Tasks
[ ] Create multi-step onboarding wizard component
    - Step 1: Basic info (name, profession)
    - Step 2: Work & interests
    - Step 3: Goals (30-day, 365-day)
    - Step 4: Daily activities & routines
    - Step 5: Side projects & hobbies
- [ ] Design onboarding UI with progress indicators
- [ ] Add skip/back navigation between steps
- [ ] Create engaging copy for each onboarding step
- [ ] Add onboarding completion tracking
- [ ] Create "Edit Profile" flow from existing data
- [ ] Add profile completeness indicator
- [ ] Implement onboarding tips/examples for each field

#### Backend Tasks
- [ ] Create onboarding status tracking in user model 
- [ ] Add onboarding_completed timestamp field
- [ ] Create endpoint to track onboarding progress
- [ ] Enhance user context generation from profile data
- [ ] Create user preference learning system
- [ ] Add analytics for onboarding drop-off points
- [ ] Implement profile validation rules

#### Review
Please check through all the code you just wrote and make sure it follows security best practices. Make sure no sensitive information is in the front end and here are
some vulnerabilities people can exploit:

1. SQL Injection
2. XSS
3. CSRF

#### Productivity
When I am coding with Al there are long breaks into between me giving me commands to the Al. Typically I spend that time doom scrolling which distracts me and puts me in a bad mental state. I'd like to use that time now to chat with you and generate new ideas, and also reflect on my other ideas and businesses and content. I'm not sure how l'd like to use this chat or what role l'd like you to play, but I think ti could be much more useful than me doom scrolling. What do you think? What could be the best way for us to use this chat?