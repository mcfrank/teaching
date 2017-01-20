var studentInitialNu = 11;
var numQuestionsPerAssessment = 5;
var numTimeSteps = 5;
var numAssessments = 2;
var teacherMus = [.5, .6, .7, .8, .9];
var teacherNu = 10;

// Generate a sequence of student priorAlphas and priorBetas
var generateSequence = function(numStudents, min, max){

  return repeat(numStudents, function(){uniformDraw(_.range(1,10))});
}

// Returns numStudents students with true and guessed Alpha and Betas
var generateStudentsArray = function(numStudents){

  //Alphas and betas initially sum to studentInitialNu
  var priorAlphas = generateSequence(numStudents, 1, studentInitialNu - 1);
  var priorBetas = map(function(alpha){
    return studentInitialNu-alpha;
  }, priorAlphas);

  //Guessed alphas and betas are initially the MLE of the generative distribution
  var guessAlpha = studentInitialNu / 2;
  var guessBeta = studentInitialNu / 2;

  //Generate array of students
  var students = map2(function(priorAlpha, priorBeta){
    return {priorAlpha: priorAlpha, priorBeta: priorBeta, guessAlpha: guessAlpha, guessBeta: guessBeta}
  }, priorAlphas, priorBetas);
  

  return students; 
}

// Seeds the guessed params of each student by sampling a Bernoulli variable with the student's true belief as the bias
var assess = function(students, numAssessments){
	var numQuestionsToAsk = numAssessments * numQuestionsPerAssessment;

	var assessedStudents = map(function(student){
		var studentMu = student.priorAlpha / (student.priorAlpha + student.priorBeta);

		//Sample from student's beliefs numQuestionsToAsk times
		var answers = sum(repeat(numQuestionsToAsk, function(){ 
				return flip(studentMu);}
			));

    //Smoothing, in case of extremes
    var answers = Math.min(Math.max(answers, 1), numQuestionsToAsk - 1);

		//Seed admin beliefs about student
		return {priorAlpha: student.priorAlpha, priorBeta: student.priorBeta, guessAlpha: answers, guessBeta: numQuestionsToAsk-answers};

	}, students);

	return assessedStudents;
}

// Helper function to sort students by true or guessed prior distribution
var sortStudents = function(students, trueValue) {
  //Sort on true alphas/betas
  var trueBetaMeanFn = function(x){return x.priorAlpha / (x.priorAlpha + x.priorBeta + 0.0)};

  //Sort on guessed alphas/betas
  var guessBetaMeanFn = function(x){return x.guessAlpha / (x.guessAlpha + x.guessBeta + 0.0)};

  if(trueValue){
	  var sortedStudents = sortOn(students, trueBetaMeanFn)
	  
	  return sortedStudents;
	}
	else{
	  var sortedStudents = sortOn(students, guessBetaMeanFn)
	  
	  return sortedStudents;
	}
}

// Helper function to distribute students into N classrooms
var distributeStudents = function(students, N){
  if (N < 2) { return [students]; };

  var len = students.length;
  
  if (len % N === 0) {
    var size = Math.floor(len / N);
    return [students.slice(0, size)].concat(distributeStudents(students.slice(size), N-1))
  }

  else {
    var size = Math.ceil(len / N);
    return [students.slice(0, size)].concat(distributeStudents(students.slice(size), N-1))
  }
}

// Get the ACTUAL information gain if the teacher chooses the examples they BELIEVE will best improve IG.
var getTeacherIG = function(students, targetParams, numExamples){
  return Infer({method: 'enumerate'}, function(){
    
    //Use this to seed the prior likelihoods of examples
    var target = targetParams.alpha / (targetParams.alpha + targetParams.beta);

    var h = uniformDraw(_.range(0, numExamples + 1));
    var t = numExamples - h;

    console.log("target params: alpha: " + targetParams.alpha + " ; beta: " + targetParams.beta);

    var believedIGs = map(function(student){
      console.log("--------");
      console.log("Student: priorAlpha: " + student.priorAlpha + " ; priorBeta: " + student.priorBeta + " ; guessAlpha: " + student.guessAlpha + " ; guessBeta: " + student.guessBeta);

      var score = IG2(targetParams.alpha, targetParams.beta, student.guessAlpha, student.guessBeta, h, t)
      console.log("Score: " + score);
      return score;
      //return IG2(targetParams.alpha, targetParams.beta, student.guessAlpha, student.guessBeta, h, t);
    }, students)

    var actualIGs = map(function(student){
      return IG2(targetParams.alpha, targetParams.beta, student.priorAlpha, student.priorBeta, h, t);
    }, students)

    console.log("Believed IGs: " + believedIGs);
    console.log("Actual IGs: " + actualIGs);
    
    //Weight choice of examples by what teacher believes the IGs will be
    factor(sum(believedIGs));
    
    //Return as the score what the actual IGs will be
    return sum(actualIGs);

  });
}

// Get the total information gain of all students 
var getAdminIG = function(students, numTeachers, targetParams, numExamples){
  // Array of student distributed into subsets representing numTeachers classrooms
  var distributedStudents = distributeStudents(students, numTeachers);
  
  // Assign teachers to teach each classroom
    var classroomExpectations = map(function(studentsInClassroom){
      var teacherIG = getTeacherIG(studentsInClassroom, targetParams, numExamples);
      return MAP(teacherIG).val;

    }, distributedStudents);

    return classroomExpectations;
}

var results = mapN(function(trialNum){

  console.log("entered results function");

	var studentsArray = generateStudentsArray(10);
	var assessedStudents = assess(studentsArray, numAssessments);
	var sortedStudents = sortStudents(studentsArray, false); //Sort by guessed params, not true params

  console.log("students generated for trial " + trialNum);

	//Run simulation for all bias levels
	var teacherMusMapping = map(function(mu){

		var teacherAlpha = teacherNu * mu;
		var teacherBeta = teacherNu - teacherAlpha;
		var targetParams = {alpha: teacherAlpha, beta: teacherBeta};

    console.log("testing teacher with mu " + mu);

		var numTeachers = 1;
		var numExamples = numTimeSteps - numAssessments;

		var unsortedIG = Math.sum(getAdminIG(assessedStudents, numTeachers, targetParams, numExamples));
		
    console.log("unsortedIG calculated: " + unsortedIG);

    var sortedIG = Math.sum(getAdminIG(sortedStudents, numTeachers, targetParams, numExamples));

    console.log("sortedIG calculated: " + sortedIG)

		return {trialNum: trialNum, numTeachers: numTeachers, numAssessments: numAssessments, numExamples: numExamples, teacherMu: mu, sorted: "sorted", IG: sortedIG}

	}, teacherMus);

}, 10); // Run 100 trials

results