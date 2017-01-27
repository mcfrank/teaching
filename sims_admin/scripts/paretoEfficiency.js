var output_file = "pareto-5example.csv";
var output_handle = webpplCsv.openFile(output_file);
webpplCsv.writeLine(output_handle, "trialNum, NumTeachers, NumAssessments, target, IG, scoreAboveBaseline");

var budget = 100

var results = mapN(function(trialNum){

  var studentsArray = generateStudentsArray(100);
  var sortedStudents = sortStudents(studentsArray);

  var teacherMusMapping = map(function(mu){

    var teacherAlpha = mu*10;
    var teacherBeta = teacherNu - teacherAlpha;

    var targetParams = {alpha: teacherAlpha, beta: teacherBeta};

    var numTeachersMapping = map(function(numTeachers){
      var numAssessmentsMapping = map(function(numAssessments){

        if(numTeachers * 10 + numAssessments * 20 > 100){
          var noisyIG = 0;
          webpplCsv.writeLine(output_handle, trialNum+"," +numTeachers+"," +numAssessments+"," + mu+"," + noisyIG+",0");
        }
        else{
          var noisyStudents = updateStudentGuesses(sortedStudents, numAssessments);
          var sortedNoisyStudents = sortNoisyStudents(noisyStudents);
          print(noisyStudents[90].guessAlpha / (noisyStudents[90].guessAlpha + noisyStudents[90].guessBeta));
          var noisyIG = Math.sum(getAdminNoisyIG(sortedNoisyStudents, numTeachers, targetParams, 5));
        
          webpplCsv.writeLine(output_handle, trialNum+"," +numTeachers+"," +numAssessments+"," + mu+"," + noisyIG+",0");

        }
                return true;
        }, numAssessments);
      }, numTeachersArr);
  }, teacherMus);

}, 100);

webpplCsv.closeFile(output_handle);